"use server";

import { z } from "zod";
import { type ActionResult, type AdminClient, asAdmin, explainError, failure, GONE, publishChanges, success, successWith } from "../admin";
import { COLLECTIONS, type CollectionDefinition, type CollectionKey } from "../definitions";
import { type FormValues, type MediaItem, sanitizeFields, slugify, validateFields } from "../fields";

const id = z.uuid();

const isCollection = (key: string): key is CollectionKey => key in COLLECTIONS;

/** Only the tables in this file's definitions can be reached, never one named by the browser. */
const definitionOf = (key: string) => (isCollection(key) ? COLLECTIONS[key] : null);

/** Every list has an id, an order and a visibility, which the types cannot express across tables. */
const tableOf = (supabase: AdminClient, table: CollectionDefinition["table"]) => supabase.from(table as "services");

export async function saveCollectionItem(collection: string, itemId: string | null, rawValues: FormValues): Promise<ActionResult<{ id: string }>> {
  const definition = definitionOf(collection);
  if (!definition) return failure("This list does not exist.");
  if (itemId !== null && !id.safeParse(itemId).success) return failure("This item could not be found.");

  return asAdmin(async (supabase) => {
    const values = sanitizeFields(definition.fields, rawValues);

    // A new category gets its system name from its English name.
    const nameSource = values.name as { en?: string } | undefined;
    if ("slug" in values && !values.slug && nameSource?.en) values.slug = slugify(nameSource.en);

    const errors = validateFields(definition.fields, values);
    if (Object.keys(errors).length > 0) return failure("Please fix the highlighted fields.", errors);

    // Linked projects live in their own table, and images are stored by id.
    const { proof, ...columns } = values;
    const row: Record<string, unknown> = { ...columns, ...("fixed" in definition ? definition.fixed : {}) };
    for (const field of definition.fields) {
      if (field.type === "media") row[field.key] = (values[field.key] as MediaItem | null)?.id ?? null;
      if (field.type === "icon") row[field.key] = (values[field.key] as string) || null;
    }

    const table = tableOf(supabase, definition.table);
    let savedId = itemId;

    if (itemId) {
      const { data, error } = await table.update(row as never).eq("id", itemId).select("id");
      if (error) return explainError(error, { unique: "That short name is already used by another item." });
      if (!data.length) return GONE;
    } else {
      // New items go to the end of the list.
      let lastQuery = table.select("display_order").order("display_order", { ascending: false }).limit(1);
      if ("fixed" in definition) lastQuery = lastQuery.eq("location" as never, definition.fixed.location as never);
      const { data: last } = await lastQuery;
      const display_order = (last?.[0]?.display_order ?? -1) + 1;

      const { data, error } = await table.insert({ ...row, display_order } as never).select("id").single();
      if (error) return explainError(error, { unique: "That short name is already used by another item." });
      savedId = data.id;
    }

    if (definition.key === "services" && savedId) {
      const projectIds = z.array(id).parse(proof ?? []);
      const { error: clearError } = await supabase.from("service_projects").delete().eq("service_id", savedId);
      if (clearError) return explainError(clearError);
      if (projectIds.length > 0) {
        const { error: linkError } = await supabase
          .from("service_projects")
          .insert(projectIds.map((project_id, display_order) => ({ service_id: savedId as string, project_id, display_order })));
        if (linkError) return explainError(linkError);
      }
    }

    publishChanges();
    return successWith({ id: savedId as string });
  });
}

export async function deleteCollectionItem(collection: string, itemId: string): Promise<ActionResult> {
  const definition = definitionOf(collection);
  if (!definition) return failure("This list does not exist.");
  if (!id.safeParse(itemId).success) return failure("This item could not be found.");

  return asAdmin(async (supabase) => {
    const table = tableOf(supabase, definition.table);
    const { error } = await table.delete().eq("id", itemId);
    if (error) {
      return explainError(error, {
        inUse: `This ${definition.singular} is still used by at least one project. Move those projects to another ${definition.singular} first.`,
      });
    }
    publishChanges();
    return success();
  });
}

export async function setCollectionItemVisible(collection: string, itemId: string, visible: boolean): Promise<ActionResult> {
  const definition = definitionOf(collection);
  if (!definition) return failure("This list does not exist.");
  if (!id.safeParse(itemId).success) return failure("This item could not be found.");

  return asAdmin(async (supabase) => {
    const table = tableOf(supabase, definition.table);
    const { data, error } = await table.update({ visible } as never).eq("id", itemId).select("id");
    if (error) return explainError(error);
    if (!data.length) return GONE;
    publishChanges();
    return success();
  });
}

export async function reorderCollection(collection: string, ids: string[]): Promise<ActionResult> {
  const definition = definitionOf(collection);
  if (!definition) return failure("This list does not exist.");
  if (!z.array(id).safeParse(ids).success) return failure("This list could not be reordered.");

  return asAdmin(async (supabase) => {
    const { error } = await supabase.rpc("reorder_rows", { p_table: definition.table, p_ids: ids });
    if (error) return explainError(error);
    publishChanges();
    return success();
  });
}

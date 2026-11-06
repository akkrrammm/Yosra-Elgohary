"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteCollectionItem, reorderCollection, saveCollectionItem, setCollectionItemVisible } from "@/lib/cms/actions/collections";
import { callAction } from "@/lib/cms/call-action";
import { COLLECTIONS, type CollectionKey } from "@/lib/cms/definitions";
import { emptyValues, type FormValues } from "@/lib/cms/fields";
import type { LocalizedText } from "@/lib/supabase/database.types";
import type { FormContext } from "./fields/FieldRenderer";
import { FormCard } from "./FormCard";
import { useConfirm, useToast } from "./providers";
import { Badge, Button, Card, EmptyState, IconButton } from "./ui";

export type CollectionRow = FormValues & { id: string; visible?: boolean };

const describe = (value: unknown) => (typeof value === "string" ? value : ((value as LocalizedText)?.en ?? (value as LocalizedText)?.ar ?? ""));

type Props = {
  collection: CollectionKey;
  rows: CollectionRow[];
  context?: FormContext;
  title?: string;
  description?: string;
};

/** A list of items: add, edit, delete, hide and reorder. Every list in the dashboard uses this. */
export function CollectionManager({ collection, rows: initialRows, context, title, description }: Props) {
  const definition = COLLECTIONS[collection];
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<CollectionRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // On a long list the form would otherwise open out of sight, below the last row.
  const editingKey = editing === "new" ? "new" : (editing?.id ?? null);
  useEffect(() => {
    if (editingKey) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingKey]);

  // Fresh data from the server replaces the local copy after every save.
  const [lastRows, setLastRows] = useState(initialRows);
  if (lastRows !== initialRows) {
    setLastRows(initialRows);
    setRows(initialRows);
  }

  const itemName = (row: CollectionRow) => describe(row[definition.titleKey]) || `Untitled ${definition.singular}`;

  const applyOrder = async (next: CollectionRow[]) => {
    const previous = rows;
    setRows(next);
    setBusy(true);
    const result = await callAction(() => reorderCollection(collection, next.map((row) => row.id)));
    setBusy(false);
    if (result.ok) {
      toast.success("New order saved.");
      router.refresh();
    } else {
      setRows(previous);
      toast.error(result.error);
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    void applyOrder(next);
  };

  const toggleVisible = async (row: CollectionRow) => {
    const visible = !row.visible;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, visible } : item)));
    const result = await callAction(() => setCollectionItemVisible(collection, row.id, visible));
    if (result.ok) {
      toast.success(visible ? `“${itemName(row)}” is now showing on the website.` : `“${itemName(row)}” is now hidden from the website.`);
      router.refresh();
    } else {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, visible: !visible } : item)));
      toast.error(result.error);
    }
  };

  const remove = async (row: CollectionRow) => {
    const ok = await confirm({
      title: `Delete “${itemName(row)}”?`,
      message: "This cannot be undone. If you might want it later, hide it instead.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    const result = await callAction(() => deleteCollectionItem(collection, row.id));
    if (result.ok) {
      setRows((current) => current.filter((item) => item.id !== row.id));
      if (editing !== "new" && editing?.id === row.id) setEditing(null);
      toast.success("Deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={title ?? `Your ${definition.plural}`}
        description={description}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden className="size-4" />
            Add {definition.singular}
          </Button>
        }
      >
        {rows.length === 0 ? (
          <EmptyState title={definition.emptyMessage} />
        ) : (
          <ul className="flex flex-col gap-2" aria-busy={busy}>
            {rows.map((row, index) => (
              <li
                key={row.id}
                draggable
                onDragStart={() => {
                  dragIndex.current = index;
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(index);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(null);
                  if (dragIndex.current !== null) move(dragIndex.current, index);
                  dragIndex.current = null;
                }}
                className={`flex items-center gap-2 rounded-xl p-2 ring-1 transition-colors ${dragOver === index ? "bg-soft ring-brand" : "ring-ink/10"} ${row.visible === false ? "bg-ink/[0.03]" : ""}`}
              >
                <GripVertical aria-hidden className="hidden size-4 shrink-0 cursor-grab text-ink/40 sm:block" />
                <button type="button" onClick={() => setEditing(row)} className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left hover:bg-soft">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{itemName(row)}</span>
                    {row.visible === false && <Badge>Hidden</Badge>}
                  </span>
                  {"subtitleKey" in definition && definition.subtitleKey && describe(row[definition.subtitleKey]) && (
                    <span className="block truncate text-sm text-ink/65">{describe(row[definition.subtitleKey])}</span>
                  )}
                </button>
                <div className="flex shrink-0 items-center">
                  <IconButton label={`Move ${itemName(row)} up`} disabled={index === 0 || busy} onClick={() => move(index, index - 1)}>
                    <ArrowUp aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Move ${itemName(row)} down`} disabled={index === rows.length - 1 || busy} onClick={() => move(index, index + 1)}>
                    <ArrowDown aria-hidden className="size-4" />
                  </IconButton>
                  {definition.canHide && (
                    <IconButton label={row.visible === false ? `Show ${itemName(row)}` : `Hide ${itemName(row)}`} onClick={() => toggleVisible(row)}>
                      {row.visible === false ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                    </IconButton>
                  )}
                  <IconButton label={`Edit ${itemName(row)}`} onClick={() => setEditing(row)}>
                    <Pencil aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Delete ${itemName(row)}`} onClick={() => remove(row)}>
                    <Trash2 aria-hidden className="size-4" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <div ref={editorRef} className="relative scroll-mt-20">
          <IconButton label="Close this form" onClick={() => setEditing(null)} className="absolute right-3 top-3 z-10">
            <X aria-hidden className="size-4" />
          </IconButton>
          <FormCard
            key={editing === "new" ? "new" : editing.id}
            title={editing === "new" ? `New ${definition.singular}` : `Edit “${itemName(editing)}”`}
            fieldsets={[{ fields: definition.fields }]}
            initialValues={editing === "new" ? emptyValues(definition.fields) : editing}
            context={context}
            saveLabel={editing === "new" ? `Add ${definition.singular}` : "Save changes"}
            onSave={(values) => saveCollectionItem(collection, editing === "new" ? null : editing.id, values)}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

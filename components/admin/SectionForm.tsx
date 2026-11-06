"use client";

import { saveSection } from "@/lib/cms/actions/sections";
import { saveSeoPage, saveSettings } from "@/lib/cms/actions/settings";
import { SECTIONS, SEO_FIELDSETS, type SectionKey, SETTINGS_GROUPS, type SettingsGroupKey } from "@/lib/cms/definitions";
import type { FormValues } from "@/lib/cms/fields";
import { FormCard } from "./FormCard";

/** The form for one block of page content. */
export function SectionForm({ sectionKey, values, visible, id }: { sectionKey: SectionKey; values: FormValues; visible: boolean; id?: string }) {
  const definition = SECTIONS[sectionKey];
  return (
    <FormCard
      id={id}
      title={definition.title}
      description={definition.description}
      fieldsets={definition.fieldsets}
      initialValues={values}
      visible={definition.canHide ? visible : undefined}
      onSave={(next, nextVisible) => saveSection(sectionKey, next, definition.canHide ? nextVisible : undefined)}
    />
  );
}

/** The form for one group of website settings. */
export function SettingsForm({ group, values, id }: { group: SettingsGroupKey; values: FormValues; id?: string }) {
  const definition = SETTINGS_GROUPS[group];
  return (
    <FormCard
      id={id}
      title={definition.title}
      description={definition.description}
      fieldsets={definition.fieldsets}
      initialValues={values}
      onSave={(next) => saveSettings(group, next)}
    />
  );
}

/** The search and sharing form for one page. */
export function SeoPageForm({ pageKey, title, description, values }: { pageKey: string; title: string; description: string; values: FormValues }) {
  return <FormCard title={title} description={description} fieldsets={SEO_FIELDSETS} initialValues={values} onSave={(next) => saveSeoPage(pageKey, next)} />;
}

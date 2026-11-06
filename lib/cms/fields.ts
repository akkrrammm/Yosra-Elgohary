import type { LocalizedText, MediaBucket, MediaFolder, MediaKind } from "@/lib/supabase/database.types";

/**
 * A form is described once here and used for both its controls and its validation,
 * in the browser and again on the server. Nothing in this file can run only on one side.
 */

export type MediaItem = {
  id: string;
  url: string;
  bucket: MediaBucket;
  path: string;
  kind: MediaKind;
  folder: MediaFolder;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  original_name: string;
  alt: LocalizedText;
  created_at: string;
};

type Base = {
  key: string;
  label: string;
  help?: string;
  required?: boolean;
};

export type TextField = Base & {
  type: "text" | "textarea";
  /** Written separately in English and Arabic. */
  localized?: boolean;
  max?: number;
  placeholder?: string;
  rows?: number;
  /** Fine to leave in one language, such as a name or a project title, so no reminder is shown. */
  arabicOptional?: boolean;
};
export type LinkField = Base & { type: "link"; placeholder?: string };
export type UrlField = Base & { type: "url"; placeholder?: string };
export type EmailField = Base & { type: "email"; placeholder?: string };
export type PhoneField = Base & { type: "phone"; placeholder?: string };
export type SlugField = Base & { type: "slug"; source?: string };
export type ToggleField = Base & { type: "toggle" };
export type IconField = Base & { type: "icon" };
export type ColorField = Base & { type: "color" };
export type SelectField = Base & { type: "select"; options: { value: string; label: string }[]; allowEmpty?: boolean };
export type ChecklistField = Base & { type: "checklist"; options: { value: string; label: string }[] };
export type TagsField = Base & { type: "tags"; localized?: boolean; placeholder?: string };
export type MediaField = Base & { type: "media"; folder: MediaFolder; kind?: MediaKind; multiple?: boolean };
export type ProjectsField = Base & { type: "projects" };
export type ListField = Base & {
  type: "list";
  itemLabel: string;
  /** The field whose text names each row when it is collapsed. */
  titleKey?: string;
  fields: FieldDef[];
  max?: number;
};

export type FieldDef =
  | TextField
  | LinkField
  | UrlField
  | EmailField
  | PhoneField
  | SlugField
  | ToggleField
  | IconField
  | ColorField
  | SelectField
  | ChecklistField
  | TagsField
  | MediaField
  | ProjectsField
  | ListField;

export type Fieldset = { title?: string; description?: string; fields: FieldDef[] };

export type FormValues = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/*  Rules                                                                     */
/* -------------------------------------------------------------------------- */

const LINK = /^(#[\w-]+|\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i;
const URL_PATTERN = /^https?:\/\/[^\s]+\.[^\s]+$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{6,20}$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");

export const flattenFields = (fieldsets: Fieldset[]) => fieldsets.flatMap((set) => set.fields);

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Everything still missing or wrong, keyed by field path such as "principles.0.title". */
export function validateFields(fields: FieldDef[], values: FormValues, prefix = ""): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const path = `${prefix}${field.key}`;
    const value = values[field.key];

    switch (field.type) {
      case "text":
      case "textarea": {
        if (field.localized) {
          const localized = (value ?? {}) as LocalizedText;
          if (field.required && !text(localized.en).trim()) errors[path] = "English text is required.";
          if (field.max) {
            if (text(localized.en).length > field.max) errors[path] = `Keep the English text under ${field.max} characters.`;
            if (text(localized.ar).length > field.max) errors[path] = `Keep the Arabic text under ${field.max} characters.`;
          }
        } else {
          if (field.required && !text(value).trim()) errors[path] = "This is required.";
          if (field.max && text(value).length > field.max) errors[path] = `Keep this under ${field.max} characters.`;
        }
        break;
      }
      case "link": {
        const link = text(value).trim();
        if (field.required && !link) errors[path] = "This is required.";
        else if (link && !LINK.test(link)) {
          errors[path] = "Use a section like #contact, a page like /work, or a full address starting with https://";
        }
        break;
      }
      case "url": {
        const url = text(value).trim();
        if (field.required && !url) errors[path] = "This is required.";
        else if (url && !URL_PATTERN.test(url)) errors[path] = "Enter a full address starting with https://";
        break;
      }
      case "email": {
        const email = text(value).trim();
        if (field.required && !email) errors[path] = "This is required.";
        else if (email && !EMAIL.test(email)) errors[path] = "Enter a valid email address.";
        break;
      }
      case "phone": {
        const phone = text(value).trim();
        if (field.required && !phone) errors[path] = "This is required.";
        else if (phone && !PHONE.test(phone)) errors[path] = "Enter a phone number with digits, like +20 100 123 4567.";
        break;
      }
      case "slug": {
        const slug = text(value).trim();
        if (field.required && !slug) errors[path] = "This is required.";
        else if (slug && !SLUG.test(slug)) errors[path] = "Use lowercase English letters, numbers and dashes only.";
        break;
      }
      case "color": {
        const color = text(value).trim();
        if (field.required && !color) errors[path] = "This is required.";
        else if (color && !COLOR.test(color)) errors[path] = "Enter a color like #17151F.";
        break;
      }
      case "select": {
        const selected = text(value);
        if (field.required && !selected) errors[path] = "Please choose one.";
        else if (selected && !field.options.some((option) => option.value === selected)) errors[path] = "Please choose from the list.";
        break;
      }
      case "checklist": {
        if (field.required && (!Array.isArray(value) || value.length === 0)) errors[path] = "Choose at least one.";
        break;
      }
      case "media": {
        const empty = field.multiple ? !Array.isArray(value) || value.length === 0 : !value;
        if (field.required && empty) errors[path] = "Please choose a file.";
        break;
      }
      case "list": {
        const items = Array.isArray(value) ? (value as FormValues[]) : [];
        if (field.required && items.length === 0) errors[path] = "Add at least one.";
        if (field.max && items.length > field.max) errors[path] = `No more than ${field.max}.`;
        items.forEach((item, index) => Object.assign(errors, validateFields(field.fields, item, `${path}.${index}.`)));
        break;
      }
      default:
        break;
    }
  }

  return errors;
}

const cleanLocalized = (value: unknown): LocalizedText => {
  const source = (value ?? {}) as LocalizedText;
  const result: LocalizedText = {};
  if (text(source.en).trim()) result.en = text(source.en).trim();
  if (text(source.ar).trim()) result.ar = text(source.ar).trim();
  return result;
};

const cleanTags = (value: unknown) =>
  [...new Set((Array.isArray(value) ? value : []).map((item) => text(item).trim()).filter(Boolean))];

/** Keeps only the fields the form defines, trimmed and in the shape the database expects. */
export function sanitizeFields(fields: FieldDef[], values: FormValues): FormValues {
  const clean: FormValues = {};

  for (const field of fields) {
    const value = values[field.key];
    switch (field.type) {
      case "text":
      case "textarea":
        clean[field.key] = field.localized ? cleanLocalized(value) : text(value).trim();
        break;
      case "toggle":
        clean[field.key] = value === true;
        break;
      case "tags":
        if (field.localized) {
          const source = (value ?? {}) as { en?: unknown; ar?: unknown };
          const en = cleanTags(source.en);
          const ar = cleanTags(source.ar);
          clean[field.key] = { ...(en.length ? { en } : {}), ...(ar.length ? { ar } : {}) };
        } else {
          clean[field.key] = cleanTags(value);
        }
        break;
      case "checklist":
        clean[field.key] = cleanTags(value);
        break;
      case "list":
        clean[field.key] = (Array.isArray(value) ? (value as FormValues[]) : []).map((item) => sanitizeFields(field.fields, item));
        break;
      case "media":
      case "projects":
        clean[field.key] = value ?? (field.type === "projects" || field.multiple ? [] : null);
        break;
      default:
        clean[field.key] = text(value).trim();
    }
  }

  return clean;
}

/** Sensible starting values for an empty form. */
export function emptyValues(fields: FieldDef[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    switch (field.type) {
      case "text":
      case "textarea":
        values[field.key] = field.localized ? {} : "";
        break;
      case "toggle":
        values[field.key] = false;
        break;
      case "tags":
        values[field.key] = field.localized ? {} : [];
        break;
      case "checklist":
      case "list":
      case "projects":
        values[field.key] = [];
        break;
      case "media":
        values[field.key] = field.multiple ? [] : null;
        break;
      case "select":
        values[field.key] = field.allowEmpty ? "" : (field.options[0]?.value ?? "");
        break;
      default:
        values[field.key] = "";
    }
  }
  return values;
}

/** Localized fields in this form that still have no Arabic text, for the overview's checklist. */
export function missingArabic(fields: FieldDef[], values: FormValues): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if ((field.type === "text" || field.type === "textarea") && field.localized && !field.arabicOptional) {
      const localized = (values[field.key] ?? {}) as LocalizedText;
      if (text(localized.en).trim() && !text(localized.ar).trim()) missing.push(field.label);
    }
    if (field.type === "list") {
      for (const item of Array.isArray(values[field.key]) ? (values[field.key] as FormValues[]) : []) {
        missing.push(...missingArabic(field.fields, item));
      }
    }
  }
  return missing;
}

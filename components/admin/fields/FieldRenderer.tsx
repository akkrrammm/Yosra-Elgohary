"use client";

import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { CMS_ICONS } from "@/lib/cms/icons";
import { type FieldDef, type FormValues, type ListField, type MediaField, type MediaItem, emptyValues, slugify } from "@/lib/cms/fields";
import type { LocalizedList, LocalizedText } from "@/lib/supabase/database.types";
import { MediaPicker } from "../media/MediaPicker";
import { useConfirm } from "../providers";
import { Button, IconButton, inputClass, Switch } from "../ui";
import { MediaThumb } from "./MediaThumb";

export type FormContext = {
  /** Projects offered when linking a service to its proof. */
  projects?: { id: string; title: string }[];
  /** Keeps field ids unique when a page has several forms with the same fields. */
  idPrefix?: string;
};

type RenderProps = {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  errors: Record<string, string>;
  path: string;
  context: FormContext;
  /** The whole form, for fields that fill themselves in from another field. */
  siblings: FormValues;
};

type InnerProps = RenderProps & { domId: string };

function FieldShell({
  id,
  label,
  required,
  help,
  error,
  children,
  isGroup,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: React.ReactNode;
  isGroup?: boolean;
}) {
  const heading = (
    <>
      {label}
      {required && (
        <span aria-hidden className="ml-0.5 text-brand">
          *
        </span>
      )}
    </>
  );
  return (
    <div data-field={id} data-invalid={error ? "true" : undefined}>
      {isGroup ? (
        <p className="mb-1.5 text-sm font-semibold">{heading}</p>
      ) : (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
          {heading}
        </label>
      )}
      {children}
      {help && <p className="mt-1.5 text-xs leading-relaxed text-ink/65">{help}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-ink">
          <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-pop" />
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  multiline,
  rows,
  invalid,
  placeholder,
  dir,
  lang,
  max,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  invalid?: boolean;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  lang?: string;
  max?: number;
  label?: string;
}) {
  const shared = {
    id,
    value,
    dir,
    lang,
    placeholder,
    "aria-invalid": invalid || undefined,
    "aria-label": label,
    className: inputClass,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };
  return (
    <>
      {multiline ? <textarea rows={rows ?? 3} {...shared} /> : <input type="text" {...shared} />}
      {max !== undefined && value.length > max * 0.8 && (
        <p className={`mt-1 text-right text-xs ${value.length > max ? "font-semibold text-ink" : "text-ink/60"}`}>
          {value.length} / {max}
        </p>
      )}
    </>
  );
}

function LocalizedInput({ field, value, onChange, error, domId }: InnerProps) {
  const text = field as Extract<FieldDef, { type: "text" | "textarea" }>;
  const localized = (value ?? {}) as LocalizedText;
  const english = localized.en ?? "";
  const arabic = localized.ar ?? "";
  const showReminder = !text.arabicOptional && english.trim() && !arabic.trim();

  return (
    <FieldShell id={domId} label={field.label} required={field.required} help={field.help} error={error} isGroup>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">English</span>
          <TextInput
            id={`${domId}-en`}
            label={`${field.label} in English`}
            value={english}
            multiline={text.type === "textarea"}
            rows={text.rows}
            invalid={Boolean(error)}
            placeholder={text.placeholder}
            max={text.max}
            onChange={(next) => onChange({ ...localized, en: next })}
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-ink/60" lang="ar" dir="rtl">
            العربية
          </span>
          <TextInput
            id={`${domId}-ar`}
            label={`${field.label} in Arabic`}
            value={arabic}
            multiline={text.type === "textarea"}
            rows={text.rows}
            invalid={Boolean(error)}
            dir="rtl"
            lang="ar"
            max={text.max}
            onChange={(next) => onChange({ ...localized, ar: next })}
          />
          {showReminder && <p className="mt-1 text-xs text-ink/65">Not translated yet. The Arabic site shows the English text until you add it.</p>}
        </div>
      </div>
    </FieldShell>
  );
}

function TagsEditor({ id, tags, onChange, placeholder, dir, lang, label }: { id: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string; dir?: "rtl"; lang?: string; label: string }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft.trim();
    if (next && !tags.includes(next)) onChange([...tags, next]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      {tags.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" dir={dir} lang={lang}>
          {tags.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-soft py-1 pe-1 ps-3 text-sm">
              {tag}
              <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(tags.filter((item) => item !== tag))} className="grid size-5 place-items-center rounded-full hover:bg-ink/10">
                <X aria-hidden className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        type="text"
        value={draft}
        dir={dir}
        lang={lang}
        aria-label={label}
        placeholder={placeholder}
        className={inputClass}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
      />
    </div>
  );
}

function MediaInput({ field, value, onChange, error, domId }: InnerProps) {
  const media = field as MediaField;
  const [pickerOpen, setPickerOpen] = useState(false);
  const noun = media.kind === "video" ? "video" : "image";

  if (media.multiple) {
    const items = (Array.isArray(value) ? value : []) as MediaItem[];
    const move = (index: number, delta: number) => {
      const next = [...items];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      onChange(next);
    };
    return (
      <FieldShell id={domId} label={field.label} required={field.required} help={field.help} error={error} isGroup>
        {items.length > 0 && (
          <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item, index) => (
              <li key={item.id} className="overflow-hidden rounded-xl ring-1 ring-ink/10">
                <MediaThumb item={item} className="aspect-square w-full" />
                <div className="flex items-center justify-between bg-white p-1">
                  <IconButton label={`Move ${item.original_name} earlier`} disabled={index === 0} onClick={() => move(index, -1)} className="size-8">
                    <ChevronLeft aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Remove ${item.original_name}`} onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="size-8">
                    <Trash2 aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Move ${item.original_name} later`} disabled={index === items.length - 1} onClick={() => move(index, 1)} className="size-8">
                    <ChevronRight aria-hidden className="size-4" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button variant="secondary" onClick={() => setPickerOpen(true)}>
          <Plus aria-hidden className="size-4" />
          Add {noun}s
        </Button>
        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(chosen) => onChange([...items, ...chosen])}
          multiple
          kind={media.kind}
          folder={media.folder}
          excludeIds={items.map((item) => item.id)}
        />
      </FieldShell>
    );
  }

  const item = (value ?? null) as MediaItem | null;
  return (
    <FieldShell id={domId} label={field.label} required={field.required} help={field.help} error={error} isGroup>
      <div className="flex flex-wrap items-center gap-4">
        {item ? (
          <MediaThumb item={item} className="size-28 rounded-xl ring-1 ring-ink/10" />
        ) : (
          <div className="grid size-28 place-items-center rounded-xl border-2 border-dashed border-ink/20 text-xs text-ink/60">No {noun}</div>
        )}
        <div className="min-w-0">
          {item && <p className="mb-2 max-w-64 truncate text-sm text-ink/75">{item.original_name}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPickerOpen(true)}>
              {item ? `Change ${noun}` : `Choose ${noun}`}
            </Button>
            {item && (
              <Button variant="ghost" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={([chosen]) => onChange(chosen)} kind={media.kind} folder={media.folder} />
    </FieldShell>
  );
}

function IconInput({ field, value, onChange, error, domId }: InnerProps) {
  const current = typeof value === "string" ? value : "";
  const Icon = current ? CMS_ICONS[current]?.icon : null;
  return (
    <FieldShell id={domId} label={field.label} help={field.help} error={error}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-brand">{Icon && <Icon aria-hidden className="size-5" />}</span>
        <select id={domId} value={current} onChange={(event) => onChange(event.target.value)} className={inputClass}>
          <option value="">No icon</option>
          {Object.entries(CMS_ICONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </FieldShell>
  );
}

function ProjectsInput({ field, value, onChange, error, domId, context }: InnerProps) {
  const selected = (Array.isArray(value) ? value : []) as string[];
  const projects = context.projects ?? [];
  const toggle = (id: string, on: boolean) => onChange(on ? [...selected, id] : selected.filter((item) => item !== id));
  return (
    <FieldShell id={domId} label={field.label} help={field.help} error={error} isGroup>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.id}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm hover:bg-soft">
              <input type="checkbox" className="mt-0.5 size-4 accent-brand" checked={selected.includes(project.id)} onChange={(event) => toggle(project.id, event.target.checked)} />
              {project.title}
            </label>
          </li>
        ))}
      </ul>
    </FieldShell>
  );
}

function RepeatingList({ field, value, onChange, error, errors, path, context, domId }: InnerProps) {
  const list = field as ListField;
  const confirm = useConfirm();
  const items = (Array.isArray(value) ? value : []) as FormValues[];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const titleOf = (item: FormValues, index: number) => {
    const raw = list.titleKey ? item[list.titleKey] : "";
    const title = typeof raw === "string" ? raw : ((raw as LocalizedText)?.en ?? (raw as LocalizedText)?.ar ?? "");
    return title || `${list.itemLabel} ${index + 1}`;
  };

  const update = (index: number, key: string, next: unknown) => onChange(items.map((item, i) => (i === index ? { ...item, [key]: next } : item)));

  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
    setOpenIndex(null);
  };

  const remove = async (index: number) => {
    const ok = await confirm({ title: `Remove “${titleOf(items[index], index)}”?`, message: "This takes effect when you save.", confirmLabel: "Remove", danger: true });
    if (!ok) return;
    onChange(items.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  return (
    <FieldShell id={domId} label={field.label} help={field.help} error={error} isGroup>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const itemPath = `${path}.${index}`;
          const hasError = Object.keys(errors).some((key) => key.startsWith(`${itemPath}.`));
          return (
            <li key={index} className={`rounded-xl ring-1 ${hasError ? "ring-pop" : "ring-ink/10"}`}>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  aria-expanded={isOpen || hasError}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium hover:bg-soft"
                >
                  <ChevronDown aria-hidden className={`size-4 shrink-0 transition-transform ${isOpen || hasError ? "rotate-180" : ""}`} />
                  <span className="truncate">{titleOf(item, index)}</span>
                </button>
                <IconButton label={`Move ${titleOf(item, index)} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp aria-hidden className="size-4" />
                </IconButton>
                <IconButton label={`Move ${titleOf(item, index)} down`} disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown aria-hidden className="size-4" />
                </IconButton>
                <IconButton label={`Remove ${titleOf(item, index)}`} onClick={() => remove(index)}>
                  <Trash2 aria-hidden className="size-4" />
                </IconButton>
              </div>
              {(isOpen || hasError) && (
                <div className="flex flex-col gap-4 border-t border-ink/10 p-4">
                  {list.fields.map((sub) => (
                    <FieldRenderer
                      key={sub.key}
                      field={sub}
                      value={item[sub.key]}
                      siblings={item}
                      onChange={(next) => update(index, sub.key, next)}
                      errors={errors}
                      path={`${itemPath}.${sub.key}`}
                      context={context}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {(list.max === undefined || items.length < list.max) && (
        <Button
          variant="secondary"
          className="mt-3"
          onClick={() => {
            onChange([...items, emptyValues(list.fields)]);
            setOpenIndex(items.length);
          }}
        >
          <Plus aria-hidden className="size-4" />
          Add {list.itemLabel.toLowerCase()}
        </Button>
      )}
    </FieldShell>
  );
}

export function FieldRenderer(props: Omit<RenderProps, "error"> & { error?: string }) {
  const { field, value, onChange, errors, path, siblings, context } = props;
  const error = errors[path];
  const id = `field-${context.idPrefix ?? ""}${path.replace(/\./g, "-")}`;
  const rendered = { ...props, error, domId: id };

  switch (field.type) {
    case "text":
    case "textarea":
      if (field.localized) return <LocalizedInput {...rendered} />;
      return (
        <FieldShell id={id} label={field.label} required={field.required} help={field.help} error={error}>
          <TextInput
            id={id}
            value={typeof value === "string" ? value : ""}
            multiline={field.type === "textarea"}
            rows={field.rows}
            invalid={Boolean(error)}
            placeholder={field.placeholder}
            max={field.max}
            onChange={onChange}
          />
        </FieldShell>
      );
    case "link":
    case "url":
    case "email":
    case "phone":
      return (
        <FieldShell id={id} label={field.label} required={field.required} help={field.help} error={error}>
          <input
            id={id}
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
            dir="ltr"
            inputMode={field.type === "url" ? "url" : undefined}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            aria-invalid={error ? true : undefined}
            className={inputClass}
            onChange={(event) => onChange(event.target.value)}
          />
        </FieldShell>
      );
    case "slug": {
      const source = field.source ? siblings[field.source] : undefined;
      const sourceText = typeof source === "string" ? source : ((source as LocalizedText | undefined)?.en ?? "");
      return (
        <FieldShell id={id} label={field.label} required={field.required} help={field.help} error={error}>
          <div className="flex gap-2">
            <input
              id={id}
              type="text"
              dir="ltr"
              value={typeof value === "string" ? value : ""}
              aria-invalid={error ? true : undefined}
              className={inputClass}
              onChange={(event) => onChange(event.target.value)}
            />
            {field.source && (
              <Button variant="secondary" disabled={!sourceText} onClick={() => onChange(slugify(sourceText))} className="shrink-0">
                Create from title
              </Button>
            )}
          </div>
        </FieldShell>
      );
    }
    case "toggle":
      return (
        <div data-field={id}>
          <Switch checked={value === true} onChange={onChange} label={field.label} />
          {field.help && <p className="mt-1.5 text-xs leading-relaxed text-ink/65">{field.help}</p>}
        </div>
      );
    case "select":
      return (
        <FieldShell id={id} label={field.label} required={field.required} help={field.help} error={error}>
          <select id={id} value={typeof value === "string" ? value : ""} aria-invalid={error ? true : undefined} className={inputClass} onChange={(event) => onChange(event.target.value)}>
            {field.allowEmpty && <option value="">None</option>}
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>
      );
    case "checklist": {
      const selected = (Array.isArray(value) ? value : []) as string[];
      return (
        <FieldShell id={id} label={field.label} required={field.required} help={field.help} error={error} isGroup>
          <div className="flex flex-wrap gap-4">
            {field.options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={selected.includes(option.value)}
                  onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value))}
                />
                {option.label}
              </label>
            ))}
          </div>
        </FieldShell>
      );
    }
    case "color": {
      const color = typeof value === "string" ? value : "";
      return (
        <FieldShell id={id} label={field.label} required={field.required} help={field.help} error={error}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`${field.label} picker`}
              value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#17151f"}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink/20 bg-white p-1"
              onChange={(event) => onChange(event.target.value)}
            />
            <input
              id={id}
              type="text"
              dir="ltr"
              value={color}
              placeholder="#17151F"
              aria-invalid={error ? true : undefined}
              className={inputClass}
              onChange={(event) => onChange(event.target.value)}
            />
            {color && (
              <Button variant="ghost" onClick={() => onChange("")}>
                Clear
              </Button>
            )}
          </div>
        </FieldShell>
      );
    }
    case "tags":
      if (field.localized) {
        const localized = (value ?? {}) as LocalizedList;
        return (
          <FieldShell id={id} label={field.label} help={field.help} error={error} isGroup>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">English</span>
                <TagsEditor id={`${id}-en`} label={`${field.label} in English`} tags={localized.en ?? []} placeholder={field.placeholder} onChange={(en) => onChange({ ...localized, en })} />
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-ink/60" lang="ar" dir="rtl">
                  العربية
                </span>
                <TagsEditor id={`${id}-ar`} label={`${field.label} in Arabic`} tags={localized.ar ?? []} dir="rtl" lang="ar" onChange={(ar) => onChange({ ...localized, ar })} />
              </div>
            </div>
          </FieldShell>
        );
      }
      return (
        <FieldShell id={id} label={field.label} help={field.help} error={error}>
          <TagsEditor id={id} label={field.label} tags={(Array.isArray(value) ? value : []) as string[]} placeholder={field.placeholder} onChange={onChange} />
        </FieldShell>
      );
    case "icon":
      return <IconInput {...rendered} />;
    case "media":
      return <MediaInput {...rendered} />;
    case "projects":
      return <ProjectsInput {...rendered} />;
    case "list":
      return <RepeatingList {...rendered} />;
  }
}

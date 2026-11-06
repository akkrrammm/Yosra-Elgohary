"use client";

import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { type GalleryInput, type ProjectInput, saveProject } from "@/lib/cms/actions/projects";
import { callAction } from "@/lib/cms/call-action";
import { PROJECT_FIELDSETS, SEO_FIELDSETS } from "@/lib/cms/definitions";
import { type Fieldset, flattenFields, type FormValues, slugify, validateFields } from "@/lib/cms/fields";
import type { LocalizedText } from "@/lib/supabase/database.types";
import { FieldRenderer } from "../fields/FieldRenderer";
import { useToast, useUnsavedChanges } from "../providers";
import { Badge, Button, Card, scrollToFirstError } from "../ui";
import { GalleryEditor } from "./GalleryEditor";

type Status = ProjectInput["status"];

type Props = {
  projectId: string | null;
  initial: ProjectInput;
  categories: { value: string; label: string }[];
};

const snapshotOf = (state: ProjectInput) => JSON.stringify(state);

function FieldsetFields({
  set,
  values,
  errors,
  prefix = "",
  onChange,
}: {
  set: Fieldset;
  values: FormValues;
  errors: Record<string, string>;
  prefix?: string;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {set.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values[field.key]}
          siblings={values}
          onChange={(next) => onChange(field.key, next)}
          errors={errors}
          path={`${prefix}${field.key}`}
          context={{}}
        />
      ))}
    </div>
  );
}

export function ProjectEditor({ projectId, initial, categories }: Props) {
  const router = useRouter();
  const toast = useToast();
  const formId = useId();

  const fieldsets = useMemo(() => PROJECT_FIELDSETS(categories), [categories]);
  const fields = useMemo(() => flattenFields(Object.values(fieldsets)), [fieldsets]);
  const seoFields = useMemo(() => flattenFields(SEO_FIELDSETS), []);

  const [values, setValues] = useState(initial.values);
  const [seo, setSeo] = useState(initial.seo);
  const [gallery, setGallery] = useState(initial.gallery);
  const [status, setStatus] = useState<Status>(initial.status);
  const [saved, setSaved] = useState(() => snapshotOf(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Status | null>(null);

  const dirty = snapshotOf({ values, seo, gallery, status }) !== saved;
  useUnsavedChanges(formId, dirty);

  const isNew = projectId === null;

  const setValue = (key: string, value: unknown) =>
    setValues((current) => {
      const next = { ...current, [key]: value };
      // A new project's web address follows its title until it is edited by hand.
      if (isNew && key === "title") {
        const before = slugify((current.title as LocalizedText)?.en ?? "");
        if (current.slug === before) next.slug = slugify((value as LocalizedText)?.en ?? "");
      }
      return next;
    });

  const submit = async (nextStatus: Status) => {
    const found = {
      ...validateFields(fields, values),
      ...validateFields(seoFields, seo, "seo."),
    };
    if (nextStatus === "published" && !values.cover_media_id) {
      found.cover_media_id = "Add a cover image before publishing this project.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields.");
      scrollToFirstError();
      return;
    }

    setSaving(nextStatus);
    const input: ProjectInput = { values, seo, gallery, status: nextStatus };
    const result = await callAction(() => saveProject(projectId, input));
    setSaving(null);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      if (result.fieldErrors) scrollToFirstError();
      return;
    }

    const wasPublished = status === "published";
    if (nextStatus === "published") {
      toast.success(wasPublished ? "Saved. Your changes are live on the website." : "Published. This project is now live on the website.");
    } else {
      toast.success(wasPublished ? "Unpublished. This project is now a private draft." : "Draft saved. It is not on the website yet.");
    }

    setStatus(nextStatus);
    setSaved(snapshotOf(input));
    setErrors({});

    if (isNew) router.replace(`/admin/projects/${result.data.id}`);
    else router.refresh();
  };

  const slug = String(values.slug ?? "");
  const canPreview = !isNew && !dirty;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit(status);
      }}
      className="flex flex-col gap-4 pb-20"
    >
      <Link href="/admin/projects" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink/75 hover:text-brand">
        <ArrowLeft aria-hidden className="size-4" />
        All projects
      </Link>

      <Card title={fieldsets.basics.title}>
        <FieldsetFields set={fieldsets.basics} values={values} errors={errors} onChange={setValue} />
      </Card>

      <Card title={fieldsets.cover.title}>
        <FieldsetFields set={fieldsets.cover} values={values} errors={errors} onChange={setValue} />
      </Card>

      <Card title="Image gallery" description="Shown on the project page, in this order. You can select many files at once when uploading.">
        <GalleryEditor items={gallery} onChange={(next: GalleryInput[]) => setGallery(next)} showDeck={values.tile === "deck"} />
      </Card>

      <Card title={fieldsets.story.title} description={fieldsets.story.description}>
        <FieldsetFields set={fieldsets.story} values={values} errors={errors} onChange={setValue} />
      </Card>

      <Card title={fieldsets.details.title} description={fieldsets.details.description}>
        <FieldsetFields set={fieldsets.details} values={values} errors={errors} onChange={setValue} />
      </Card>

      <Card title={fieldsets.display.title}>
        <FieldsetFields set={fieldsets.display} values={values} errors={errors} onChange={setValue} />
      </Card>

      <Card title="Search engines and sharing" description="All optional. Left empty, the project's title, short description and cover are used.">
        <div className="flex flex-col gap-8">
          {SEO_FIELDSETS.map((set) => (
            <div key={set.title}>
              <h3 className="font-heading text-base font-bold">{set.title}</h3>
              {set.description && <p className="mb-4 mt-1 text-sm text-ink/70">{set.description}</p>}
              <div className={set.description ? "" : "mt-4"}>
                <FieldsetFields set={set} values={seo} errors={errors} prefix="seo." onChange={(key, value) => setSeo((current) => ({ ...current, [key]: value }))} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2">
          {status === "published" ? <Badge tone="live">Published</Badge> : <Badge tone="draft">Draft: not on the website</Badge>}
          {dirty && <span className="text-sm text-ink/70">Unsaved changes</span>}

          <div className="ms-auto flex flex-wrap items-center gap-2">
            {canPreview && (
              <>
                <a
                  href={`/api/preview?slug=${slug}&lang=en`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-ink/5"
                >
                  <Eye aria-hidden className="size-4" />
                  Preview
                </a>
                <a href={`/api/preview?slug=${slug}&lang=ar`} target="_blank" rel="noopener noreferrer" lang="ar" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-ink/5">
                  معاينة
                </a>
              </>
            )}

            {status === "published" ? (
              <>
                <Button variant="secondary" loading={saving === "draft"} disabled={saving !== null} onClick={() => submit("draft")}>
                  Unpublish
                </Button>
                <Button type="submit" loading={saving === "published"} disabled={saving !== null || !dirty}>
                  {saving === "published" ? "Saving..." : "Save changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" loading={saving === "draft"} disabled={saving !== null || (!dirty && !isNew)} onClick={() => submit("draft")}>
                  {saving === "draft" ? "Saving..." : "Save draft"}
                </Button>
                <Button loading={saving === "published"} disabled={saving !== null} onClick={() => submit("published")}>
                  {saving === "published" ? "Publishing..." : "Publish"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

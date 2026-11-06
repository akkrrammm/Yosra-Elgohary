"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useId, useMemo, useState } from "react";
import type { ActionResult } from "@/lib/cms/admin";
import { callAction } from "@/lib/cms/call-action";
import { flattenFields, type Fieldset, type FormValues, validateFields } from "@/lib/cms/fields";
import { FieldRenderer, type FormContext } from "./fields/FieldRenderer";
import { useToast, useUnsavedChanges } from "./providers";
import { Button, Card, scrollToFirstError, Switch } from "./ui";

type Props = {
  title?: string;
  description?: string;
  fieldsets: Fieldset[];
  initialValues: FormValues;
  context?: FormContext;
  saveLabel?: string;
  /** Shows a switch that hides this block on the website. */
  visible?: boolean;
  visibilityLabel?: string;
  onSave: (values: FormValues, visible?: boolean) => Promise<ActionResult<unknown>>;
  /** Called after a successful save. Defaults to refreshing the page's data. */
  onSaved?: (result: unknown) => void;
  id?: string;
  children?: ReactNode;
};

/** A complete form: fields, validation, saving, messages and the unsaved changes warning. */
export function FormCard({
  title,
  description,
  fieldsets,
  initialValues,
  context,
  saveLabel = "Save changes",
  visible,
  visibilityLabel = "Show on the website",
  onSave,
  onSaved,
  id,
  children,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const formId = useId();
  const fields = useMemo(() => flattenFields(fieldsets), [fieldsets]);
  const fieldContext = useMemo(() => ({ ...context, idPrefix: `${formId}-` }), [context, formId]);

  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [isVisible, setIsVisible] = useState(visible);
  const [savedVisible, setSavedVisible] = useState(visible);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(savedValues) || isVisible !== savedVisible;
  useUnsavedChanges(formId, dirty);

  const setValue = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));


  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const found = validateFields(fields, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields.");
      scrollToFirstError();
      return;
    }

    setSaving(true);
    const result = await callAction(() => onSave(values, isVisible));
    setSaving(false);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      if (result.fieldErrors) scrollToFirstError();
      return;
    }

    setSavedValues(values);
    setSavedVisible(isVisible);
    setErrors({});
    toast.success("Saved. It is live on the website.");
    if (onSaved) onSaved(result.data);
    else router.refresh();
  };

  return (
    <Card
      id={id}
      title={title}
      description={description}
      actions={
        visible !== undefined ? <Switch checked={isVisible === true} onChange={setIsVisible} label={visibilityLabel} /> : undefined
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-7">
        {fieldsets.map((set, index) => (
          <fieldset key={set.title ?? index} className="flex min-w-0 flex-col gap-5">
            {set.title && (
              <legend className={`mb-5 w-full font-heading text-base font-bold ${index > 0 ? "border-t border-ink/10 pt-6" : ""}`}>
                {set.title}
                {set.description && <span className="mt-1 block font-sans text-sm font-normal leading-relaxed text-ink/70">{set.description}</span>}
              </legend>
            )}
            {set.fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={values[field.key]}
                siblings={values}
                onChange={(next) => setValue(field.key, next)}
                errors={errors}
                path={field.key}
                context={fieldContext}
              />
            ))}
          </fieldset>
        ))}

        {children}

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-5">
          <Button type="submit" loading={saving} disabled={!dirty}>
            {saving ? "Saving..." : saveLabel}
          </Button>
          {dirty && !saving && (
            <>
              <span className="text-sm text-ink/70">You have unsaved changes.</span>
              <Button
                variant="ghost"
                onClick={() => {
                  setValues(savedValues);
                  setIsVisible(savedVisible);
                  setErrors({});
                }}
              >
                Undo changes
              </Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}

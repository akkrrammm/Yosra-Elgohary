"use client";

import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { saveWall } from "@/lib/cms/actions/projects";
import { callAction } from "@/lib/cms/call-action";
import type { MediaItem } from "@/lib/cms/fields";
import { MediaThumb } from "../fields/MediaThumb";
import { useToast, useUnsavedChanges } from "../providers";
import { Button, Card, EmptyState, IconButton, inputClass } from "../ui";

export type WallCandidate = { id: string; media: MediaItem; projectTitle: string; published: boolean };

type Row = 0 | 1;
type WallEntry = { id: string; row: Row };

/** The two moving rows of pages on the homepage, chosen from the projects' galleries. */
export function WallManager({ candidates, initial }: { candidates: WallCandidate[]; initial: WallEntry[] }) {
  const router = useRouter();
  const toast = useToast();
  const formId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [entries, setEntries] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [addingTo, setAddingTo] = useState<Row | null>(null);
  const [projectFilter, setProjectFilter] = useState("");

  const dirty = JSON.stringify(entries) !== JSON.stringify(saved);
  useUnsavedChanges(formId, dirty);

  const byId = useMemo(() => new Map(candidates.map((candidate) => [candidate.id, candidate])), [candidates]);
  const projectTitles = useMemo(() => [...new Set(candidates.map((candidate) => candidate.projectTitle))], [candidates]);
  const chosen = new Set(entries.map((entry) => entry.id));

  const rowEntries = (row: Row) => entries.filter((entry) => entry.row === row);

  /** Moves within one row. The other row keeps its place in the combined list. */
  const moveWithinRow = (row: Row, from: number, to: number) => {
    const items = rowEntries(row);
    if (to < 0 || to >= items.length) return;
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    setEntries([...entries.filter((entry) => entry.row !== row), ...items]);
  };

  const openPicker = (row: Row) => {
    setAddingTo(row);
    dialogRef.current?.showModal();
  };

  const closePicker = () => {
    dialogRef.current?.close();
    setAddingTo(null);
  };

  const save = async () => {
    setSaving(true);
    const ordered = [...rowEntries(0), ...rowEntries(1)];
    const result = await callAction(() => saveWall(ordered.map((entry) => ({ gallery_item_id: entry.id, row_index: entry.row }))));
    setSaving(false);
    if (result.ok) {
      setEntries(ordered);
      setSaved(ordered);
      toast.success("Saved. The wall on the homepage is updated.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const available = candidates.filter((candidate) => !chosen.has(candidate.id) && (!projectFilter || candidate.projectTitle === projectFilter));

  return (
    <div className="flex flex-col gap-4 pb-20">
      <Link href="/admin/projects" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink/75 hover:text-brand">
        <ArrowLeft aria-hidden className="size-4" />
        All projects
      </Link>

      {([0, 1] as Row[]).map((row) => {
        const items = rowEntries(row);
        return (
          <Card
            key={row}
            title={row === 0 ? "First row" : "Second row"}
            description={row === 0 ? "Slides one way as visitors scroll." : "Slides the other way as visitors scroll."}
            actions={
              <Button variant="secondary" onClick={() => openPicker(row)}>
                <Plus aria-hidden className="size-4" />
                Add page
              </Button>
            }
          >
            {items.length === 0 ? (
              <EmptyState title="No pages in this row" />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {items.map((entry, index) => {
                  const candidate = byId.get(entry.id);
                  if (!candidate) return null;
                  const name = `${candidate.projectTitle}, page ${index + 1}`;
                  return (
                    <li key={entry.id} className="overflow-hidden rounded-xl ring-1 ring-ink/10">
                      <MediaThumb item={candidate.media} className="aspect-[4/3] w-full" sizes="220px" />
                      <p className="truncate px-2 pt-1.5 text-xs text-ink/75" title={candidate.projectTitle}>
                        {candidate.projectTitle}
                        {!candidate.published && " (draft, hidden)"}
                      </p>
                      <div className="flex items-center justify-between p-1">
                        <IconButton label={`Move ${name} earlier`} disabled={index === 0} onClick={() => moveWithinRow(row, index, index - 1)} className="size-8">
                          <ArrowUp aria-hidden className="size-4 -rotate-90" />
                        </IconButton>
                        <IconButton label={`Move ${name} later`} disabled={index === items.length - 1} onClick={() => moveWithinRow(row, index, index + 1)} className="size-8">
                          <ArrowDown aria-hidden className="size-4 -rotate-90" />
                        </IconButton>
                        <IconButton
                          label={`Move ${name} to the ${row === 0 ? "second" : "first"} row`}
                          onClick={() => setEntries(entries.map((item) => (item.id === entry.id ? { ...item, row: (row === 0 ? 1 : 0) as Row } : item)))}
                          className="size-8"
                        >
                          <ArrowLeftRight aria-hidden className="size-4" />
                        </IconButton>
                        <IconButton label={`Remove ${name} from the wall`} onClick={() => setEntries(entries.filter((item) => item.id !== entry.id))} className="size-8">
                          <Trash2 aria-hidden className="size-4" />
                        </IconButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          {dirty && <span className="text-sm text-ink/70">Unsaved changes</span>}
          <Button loading={saving} disabled={!dirty} onClick={save}>
            {saving ? "Saving..." : "Save wall"}
          </Button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Add a page to the wall"
        onCancel={() => setAddingTo(null)}
        className="m-auto h-[min(46rem,calc(100dvh-2rem))] w-[min(62rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-ink shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-4 md:px-6">
            <h2 className="font-heading text-xl font-bold tracking-tight">Add a page from a project gallery</h2>
            <div className="flex items-center gap-2">
              <label>
                <span className="sr-only">Filter by project</span>
                <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={inputClass}>
                  <option value="">All projects</option>
                  {projectTitles.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="ghost" onClick={closePicker}>
                Done
              </Button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-6">
            {available.length === 0 ? (
              <EmptyState title="No more pages to add">Images in a project&apos;s gallery appear here.</EmptyState>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {available.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => addingTo !== null && setEntries((current) => [...current, { id: candidate.id, row: addingTo }])}
                      className="block w-full overflow-hidden rounded-xl text-left ring-2 ring-transparent transition hover:ring-brand"
                    >
                      <MediaThumb item={candidate.media} className="aspect-square w-full" sizes="200px" />
                      <span className="block truncate px-1 py-1 text-xs text-ink/75">{candidate.projectTitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

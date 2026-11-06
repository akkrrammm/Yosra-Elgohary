"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, GripVertical, ImageOff, LayoutGrid, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { deleteProject, duplicateProject, reorderProjects, setProjectFeatured, setProjectStatus } from "@/lib/cms/actions/projects";
import { callAction } from "@/lib/cms/call-action";
import type { MediaItem } from "@/lib/cms/fields";
import { MediaThumb } from "../fields/MediaThumb";
import { useConfirm, useToast } from "../providers";
import { Badge, Button, Card, EmptyState, IconButton, inputClass } from "../ui";

export type ProjectListItem = {
  id: string;
  title: string;
  slug: string;
  client: string;
  status: "draft" | "published";
  featured: boolean;
  categoryId: string | null;
  categoryName: string | null;
  cover: MediaItem | null;
};

const PAGE_SIZE = 20;

export function ProjectsTable({ projects: initialProjects, categories }: { projects: ProjectListItem[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [projects, setProjects] = useState(initialProjects);
  const [lastProjects, setLastProjects] = useState(initialProjects);
  if (lastProjects !== initialProjects) {
    setLastProjects(initialProjects);
    setProjects(initialProjects);
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter && project.status !== statusFilter) return false;
      if (categoryFilter && project.categoryId !== categoryFilter) return false;
      if (!query) return true;
      return `${project.title} ${project.client} ${project.slug}`.toLowerCase().includes(query);
    });
  }, [projects, search, statusFilter, categoryFilter]);

  const canReorder = !search.trim() && !statusFilter && !categoryFilter;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const update = (id: string, change: Partial<ProjectListItem>) =>
    setProjects((current) => current.map((project) => (project.id === id ? { ...project, ...change } : project)));

  const applyOrder = async (next: ProjectListItem[]) => {
    const previous = projects;
    setProjects(next);
    const result = await callAction(() => reorderProjects(next.map((project) => project.id)));
    if (result.ok) {
      toast.success("New order saved. The website now shows projects in this order.");
      router.refresh();
    } else {
      setProjects(previous);
      toast.error(result.error);
    }
  };

  const move = (fromId: string, toId: string) => {
    const from = projects.findIndex((project) => project.id === fromId);
    const to = projects.findIndex((project) => project.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...projects];
    const [project] = next.splice(from, 1);
    next.splice(to, 0, project);
    void applyOrder(next);
  };

  const togglePublished = async (project: ProjectListItem) => {
    const status = project.status === "published" ? "draft" : "published";
    if (status === "draft") {
      const ok = await confirm({
        title: `Unpublish “${project.title}”?`,
        message: "It disappears from the website straight away. Nothing is deleted, and you can publish it again at any time.",
        confirmLabel: "Unpublish",
      });
      if (!ok) return;
    }
    setBusyId(project.id);
    const result = await callAction(() => setProjectStatus(project.id, status));
    setBusyId(null);
    if (result.ok) {
      update(project.id, { status });
      toast.success(status === "published" ? `“${project.title}” is now live on the website.` : `“${project.title}” is now a private draft.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const toggleFeatured = async (project: ProjectListItem) => {
    const featured = !project.featured;
    update(project.id, { featured });
    const result = await callAction(() => setProjectFeatured(project.id, featured));
    if (result.ok) {
      toast.success(featured ? `“${project.title}” is marked as featured.` : `“${project.title}” is no longer featured.`);
      router.refresh();
    } else {
      update(project.id, { featured: !featured });
      toast.error(result.error);
    }
  };

  const duplicate = async (project: ProjectListItem) => {
    setBusyId(project.id);
    const result = await callAction(() => duplicateProject(project.id));
    setBusyId(null);
    if (result.ok) {
      toast.success(`A copy of “${project.title}” was created as a private draft.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const remove = async (project: ProjectListItem) => {
    const ok = await confirm({
      title: `Delete “${project.title}”?`,
      message:
        project.status === "published"
          ? "It is live on the website now. This removes it for good, along with its case study text. Its images stay in the media library. To only hide it, unpublish it instead."
          : "This removes it for good, along with its case study text. Its images stay in the media library.",
      confirmLabel: "Delete project",
      danger: true,
    });
    if (!ok) return;

    setBusyId(project.id);
    const result = await callAction(() => deleteProject(project.id));
    setBusyId(null);
    if (result.ok) {
      setProjects((current) => current.filter((item) => item.id !== project.id));
      toast.success(`“${project.title}” was deleted.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const publishedCount = projects.filter((project) => project.status === "published").length;

  return (
    <Card
      title={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
      description={`${publishedCount} live on the website, ${projects.length - publishedCount} private ${projects.length - publishedCount === 1 ? "draft" : "drafts"}.`}
      actions={
        <>
          <Link href="/admin/projects/wall" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold ring-1 ring-ink/15 transition-colors hover:bg-soft">
            <LayoutGrid aria-hidden className="size-4" />
            Wall of pages
          </Link>
          <Link href="/admin/projects/new" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink">
            <Plus aria-hidden className="size-4" />
            Add project
          </Link>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search projects</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
          <input
            type="search"
            value={search}
            placeholder="Search by title or client"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} pl-9`}
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!canReorder && filtered.length > 0 && <p className="mb-3 text-sm text-ink/65">Clear the search and filters to change the order.</p>}

      {filtered.length === 0 ? (
        <EmptyState title={projects.length === 0 ? "No projects yet" : "No projects match your search"}>
          {projects.length === 0 ? (
            "Add your first project to show it on the website."
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCategoryFilter("");
              }}
            >
              Clear search and filters
            </Button>
          )}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((project) => {
            const index = projects.findIndex((item) => item.id === project.id);
            return (
              <li
                key={project.id}
                draggable={canReorder}
                onDragStart={() => {
                  dragId.current = project.id;
                }}
                onDragOver={(event) => {
                  if (!canReorder) return;
                  event.preventDefault();
                  setDragOverId(project.id);
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverId(null);
                  if (dragId.current) move(dragId.current, project.id);
                  dragId.current = null;
                }}
                aria-busy={busyId === project.id}
                className={`flex flex-col gap-2 rounded-xl p-2 ring-1 transition-colors md:flex-row md:items-center ${dragOverId === project.id ? "bg-soft ring-brand" : "ring-ink/10"}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {canReorder && <GripVertical aria-hidden className="hidden size-4 shrink-0 cursor-grab text-ink/40 md:block" />}
                  {project.cover ? (
                    <MediaThumb item={project.cover} className="size-16 shrink-0 rounded-lg" sizes="64px" />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-soft text-ink/50">
                      <ImageOff aria-hidden className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/projects/${project.id}`} className="block truncate font-semibold hover:text-brand">
                      {project.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      {project.status === "published" ? <Badge tone="live">Published</Badge> : <Badge tone="draft">Draft</Badge>}
                      {project.featured && <Badge tone="brand">Featured</Badge>}
                      {project.categoryName && <span className="text-ink/65">{project.categoryName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-0.5 md:shrink-0">
                  <Button size="sm" variant={project.status === "published" ? "secondary" : "primary"} loading={busyId === project.id} onClick={() => togglePublished(project)} className="mr-1">
                    {project.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <IconButton
                    label={project.featured ? `Remove ${project.title} from featured` : `Mark ${project.title} as featured`}
                    aria-pressed={project.featured}
                    onClick={() => toggleFeatured(project)}
                  >
                    <Star aria-hidden className={`size-4 ${project.featured ? "fill-brand text-brand" : ""}`} />
                  </IconButton>
                  {project.status === "published" ? (
                    <a href={`/en/work/${project.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.title} on the website`} title="View on the website" className="grid size-9 place-items-center rounded-full hover:bg-ink/10">
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  ) : (
                    <a href={`/api/preview?slug=${project.slug}&lang=en`} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${project.title}`} title="Preview" className="grid size-9 place-items-center rounded-full hover:bg-ink/10">
                      <Eye aria-hidden className="size-4" />
                    </a>
                  )}
                  <Link href={`/admin/projects/${project.id}`} aria-label={`Edit ${project.title}`} title="Edit" className="grid size-9 place-items-center rounded-full hover:bg-ink/10">
                    <Pencil aria-hidden className="size-4" />
                  </Link>
                  <IconButton label={`Duplicate ${project.title}`} onClick={() => duplicate(project)}>
                    <Copy aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Move ${project.title} up`} disabled={!canReorder || index === 0} onClick={() => move(project.id, projects[index - 1].id)}>
                    <ArrowUp aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Move ${project.title} down`} disabled={!canReorder || index === projects.length - 1} onClick={() => move(project.id, projects[index + 1].id)}>
                    <ArrowDown aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label={`Delete ${project.title}`} onClick={() => remove(project)}>
                    <Trash2 aria-hidden className="size-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1 text-sm">
          <IconButton label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            <ChevronLeft aria-hidden className="size-4" />
          </IconButton>
          Page {currentPage} of {totalPages}
          <IconButton label="Next page" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
            <ChevronRight aria-hidden className="size-4" />
          </IconButton>
        </div>
      )}
    </Card>
  );
}

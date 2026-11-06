"use client";

import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reorderHomepage, setSectionVisible } from "@/lib/cms/actions/sections";
import { callAction } from "@/lib/cms/call-action";
import { useToast } from "./providers";
import { Badge, Card, IconButton, Switch } from "./ui";

export type HomepageSectionRow = { key: string; label: string; href: string; visible: boolean };

/** The order of the homepage's sections, and which of them show. */
export function HomepageLayout({ sections: initial }: { sections: HomepageSectionRow[] }) {
  const router = useRouter();
  const toast = useToast();

  const [sections, setSections] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (lastInitial !== initial) {
    setLastInitial(initial);
    setSections(initial);
  }
  const [busy, setBusy] = useState(false);

  const move = async (from: number, to: number) => {
    const previous = sections;
    const next = [...sections];
    const [section] = next.splice(from, 1);
    next.splice(to, 0, section);
    setSections(next);
    setBusy(true);
    const result = await callAction(() => reorderHomepage(next.map((item) => item.key)));
    setBusy(false);
    if (result.ok) {
      toast.success("New order saved. The homepage has been updated.");
      router.refresh();
    } else {
      setSections(previous);
      toast.error(result.error);
    }
  };

  const toggle = async (section: HomepageSectionRow, visible: boolean) => {
    setSections((current) => current.map((item) => (item.key === section.key ? { ...item, visible } : item)));
    const result = await callAction(() => setSectionVisible(section.key, visible));
    if (result.ok) {
      toast.success(visible ? `${section.label} is now showing on the homepage.` : `${section.label} is now hidden from the homepage.`);
      router.refresh();
    } else {
      setSections((current) => current.map((item) => (item.key === section.key ? { ...item, visible: !visible } : item)));
      toast.error(result.error);
    }
  };

  return (
    <Card title="Page order" description="The hero and moving ribbon always come first. Use the arrows to change the order of the sections below them.">
      <ul className="flex flex-col gap-2" aria-busy={busy}>
        {sections.map((section, index) => (
          <li key={section.key} className="flex flex-wrap items-center gap-2 rounded-xl p-2 ring-1 ring-ink/10">
            <span className="w-6 text-center text-sm font-semibold text-ink/60">{index + 1}</span>
            <span className="min-w-32 flex-1 font-medium">{section.label}</span>
            {!section.visible && <Badge>Hidden</Badge>}
            <Switch hideLabel checked={section.visible} onChange={(visible) => toggle(section, visible)} label={`Show ${section.label} on the homepage`} />
            <div className="flex items-center">
              <IconButton label={`Move ${section.label} up`} disabled={index === 0 || busy} onClick={() => move(index, index - 1)}>
                <ArrowUp aria-hidden className="size-4" />
              </IconButton>
              <IconButton label={`Move ${section.label} down`} disabled={index === sections.length - 1 || busy} onClick={() => move(index, index + 1)}>
                <ArrowDown aria-hidden className="size-4" />
              </IconButton>
              <Link href={section.href} aria-label={`Edit ${section.label}`} title="Edit" className="grid size-9 place-items-center rounded-full hover:bg-ink/10">
                <Pencil aria-hidden className="size-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

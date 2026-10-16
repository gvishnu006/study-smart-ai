"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  GripVertical,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, toDateKey, getStartOfDay } from "@/lib/utils";
import { apiDelete, apiPatch } from "@/lib/fetcher";
import { EntryDialog } from "@/components/planner/entry-dialog";
import type { TimetableEntryDTO } from "@/types/app";

function startOfWeek(d: Date) {
  const date = getStartOfDay(d);
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  return date;
}

function minutesLabel(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

interface DragData {
  entry: TimetableEntryDTO;
}

function EntryCard({
  entry,
  onToggle,
  onDelete,
  onEdit,
  dragging,
}: DragData & {
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-shadow",
        dragging && "shadow-lift ring-2 ring-primary"
      )}
      style={{ borderLeft: `3px solid ${entry.subjectColor}` }}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          aria-label="Toggle done"
          onClick={onToggle}
          className={cn(
            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border",
            entry.done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border"
          )}
        >
          {entry.done ? <Check className="h-3 w-3" /> : null}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-xs font-semibold",
              entry.done && "text-muted-foreground line-through"
            )}
          >
            {entry.subjectName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {entry.topic}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {minutesLabel(entry.startMinutes)} – {minutesLabel(entry.endMinutes)}
          </p>
        </div>
      </div>
      <div className="mt-1.5 hidden items-center justify-end gap-1 group-hover:flex">
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Edit
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          onClick={onDelete}
          className="text-[11px] text-muted-foreground hover:text-destructive"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function DraggableCard(props: {
  entry: TimetableEntryDTO;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: props.entry._id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("relative touch-none", isDragging && "opacity-50")}
    >
      <button
        type="button"
        className="absolute left-0 top-0 z-10 cursor-grab p-1 text-muted-foreground/60 hover:text-foreground"
        aria-label="Drag block"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="pl-4">
        <EntryCard {...props} />
      </div>
    </div>
  );
}

function DayColumn({
  dateKey,
  label,
  isToday,
  entries,
  onToggle,
  onDelete,
  onEdit,
  onAdd,
}: {
  dateKey: string;
  label: string;
  isToday: boolean;
  entries: TimetableEntryDTO[];
  onToggle: (e: TimetableEntryDTO) => void;
  onDelete: (e: TimetableEntryDTO) => void;
  onEdit: (e: TimetableEntryDTO) => void;
  onAdd: (dateKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const totalMinutes = entries.reduce(
    (sum, e) => sum + (e.endMinutes - e.startMinutes),
    0
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[220px] flex-col rounded-xl border border-border bg-muted/20 p-2.5 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p
            className={cn(
              "text-xs font-semibold",
              isToday && "text-primary"
            )}
          >
            {label}
          </p>
          {totalMinutes > 0 ? (
            <p className="text-[10px] text-muted-foreground">
              {Math.round((totalMinutes / 60) * 10) / 10}h planned
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`Add block ${label}`}
          onClick={() => onAdd(dateKey)}
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {entries.length === 0 ? (
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Drop a block here
          </p>
        ) : (
          entries.map((e) => (
            <DraggableCard
              key={e._id}
              entry={e}
              onToggle={() => onToggle(e)}
              onDelete={() => onDelete(e)}
              onEdit={() => onEdit(e)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function TimetablePanel({
  entries,
  subjects,
  onChanged,
  onOpenGenerate,
}: {
  entries: TimetableEntryDTO[];
  subjects: { _id: string; name: string; color: string }[];
  onChanged: () => void;
  onOpenGenerate: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableEntryDTO | null>(null);
  const [addDateKey, setAddDateKey] = useState<string | undefined>();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return {
        dateKey: toDateKey(d),
        label: d.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
        }),
        isToday: toDateKey(d) === toDateKey(new Date()),
      };
    });
  }, [weekStart]);

  const byDay = useMemo(() => {
    const map = new Map<string, TimetableEntryDTO[]>();
    for (const d of days) map.set(d.dateKey, []);
    for (const e of entries) {
      const list = map.get(e.dateKey);
      if (list) list.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startMinutes - b.startMinutes);
    }
    return map;
  }, [entries, days]);

  const activeEntry = activeId ? entries.find((e) => e._id === activeId) : null;

  async function toggleDone(entry: TimetableEntryDTO) {
    try {
      await apiPatch(`/api/timetable/${entry._id}`, { done: !entry.done });
      onChanged();
    } catch {
      toast.error("Could not update block.");
    }
  }

  async function removeEntry(entry: TimetableEntryDTO) {
    try {
      await apiDelete(`/api/timetable/${entry._id}`);
      toast.success("Block removed.");
      onChanged();
    } catch {
      toast.error("Could not delete block.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const entryId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;
    const entry = entries.find((e) => e._id === entryId);
    if (!entry || entry.dateKey === overId) return;
    try {
      await apiPatch(`/api/timetable/${entry._id}`, {
        date: new Date(`${overId}T00:00:00`).toISOString(),
      });
      onChanged();
    } catch {
      toast.error("Could not move block.");
    }
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${weekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-label="Previous week"
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() - 7);
              setWeekStart(d);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {weekLabel}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-label="Next week"
            onClick={() => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + 7);
              setWeekStart(d);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Today
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setAddDateKey(toDateKey(new Date()));
              setEntryDialogOpen(true);
            }}
          >
            <CalendarPlus className="h-4 w-4" /> Add block
          </Button>
          <Button onClick={onOpenGenerate}>
            <Sparkles className="h-4 w-4" /> Generate plan
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((d) => (
            <DayColumn
              key={d.dateKey}
              dateKey={d.dateKey}
              label={d.label}
              isToday={d.isToday}
              entries={byDay.get(d.dateKey) ?? []}
              onToggle={toggleDone}
              onDelete={removeEntry}
              onEdit={(e) => {
                setEditing(e);
                setAddDateKey(undefined);
                setEntryDialogOpen(true);
              }}
              onAdd={(dateKey) => {
                setEditing(null);
                setAddDateKey(dateKey);
                setEntryDialogOpen(true);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeEntry ? (
            <div className="w-48">
              <EntryCard
                entry={activeEntry}
                onToggle={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
                dragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No study blocks yet. Generate an AI plan or add blocks manually.
            </p>
            <Button variant="outline" onClick={onOpenGenerate}>
              <Sparkles className="h-4 w-4" /> Generate plan
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <EntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        entry={editing}
        defaultDateKey={addDateKey}
        subjects={subjects}
        onSaved={onChanged}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamsPanel } from "@/components/planner/exams-panel";
import { TimetablePanel } from "@/components/planner/timetable-panel";
import { GeneratePlanDialog } from "@/components/planner/generate-plan-dialog";
import { apiFetch } from "@/lib/fetcher";
import { toDateKey } from "@/lib/utils";
import type { ExamDTO, TimetableEntryDTO } from "@/types/app";

export function PlannerView({
  subjects,
  initialExams,
  initialEntries,
}: {
  subjects: { _id: string; name: string; color: string }[];
  initialExams: ExamDTO[];
  initialEntries: TimetableEntryDTO[];
}) {
  const [exams, setExams] = useState(initialExams);
  const [entries, setEntries] = useState(initialEntries);
  const [generateOpen, setGenerateOpen] = useState(false);

  const refreshExams = useCallback(async () => {
    try {
      setExams(await apiFetch<ExamDTO[]>("/api/exams"));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshEntries = useCallback(async () => {
    try {
      const from = toDateKey(new Date());
      const to = new Date();
      to.setDate(to.getDate() + 45);
      setEntries(
        await apiFetch<TimetableEntryDTO[]>(
          `/api/timetable?from=${from}&to=${toDateKey(to)}`
        )
      );
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshExams(), refreshEntries()]);
  }, [refreshExams, refreshEntries]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="timetable">
        <TabsList>
          <TabsTrigger value="timetable">
            <CalendarDays className="mr-1.5 h-4 w-4" /> Timetable
          </TabsTrigger>
          <TabsTrigger value="exams">
            <GraduationCap className="mr-1.5 h-4 w-4" /> Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timetable">
          <TimetablePanel
            entries={entries}
            subjects={subjects}
            onChanged={refreshEntries}
            onOpenGenerate={() => setGenerateOpen(true)}
          />
        </TabsContent>

        <TabsContent value="exams">
          <ExamsPanel
            exams={exams}
            subjects={subjects}
            onChanged={refreshExams}
          />
        </TabsContent>
      </Tabs>

      <GeneratePlanDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={refreshAll}
      />
    </div>
  );
}

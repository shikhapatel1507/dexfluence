import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, closestCenter, DragOverlay,
  useDraggable, useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  GitBranch, Search, Wand2, Film, Star, CheckCircle2,
  GripVertical, Clock, Zap, Plus,
} from "lucide-react";
import type { PipelineJob, Campaign } from "@shared/schema";

const STAGES = ["Research", "Scripting", "Generating", "Review", "Posted"] as const;
type Stage = typeof STAGES[number];

const STAGE_META: Record<Stage, { icon: React.ComponentType<{ className?: string }>; color: string; badge: string }> = {
  Research: { icon: Search, color: "text-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  Scripting: { icon: Wand2, color: "text-violet-500", badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  Generating: { icon: Film, color: "text-pink-500", badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  Review: { icon: Star, color: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  Posted: { icon: CheckCircle2, color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  running: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  pending: "bg-muted text-muted-foreground",
};

function JobCard({ job, isDragging }: { job: PipelineJob; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: job.id });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  const meta = STAGE_META[job.stage as Stage] ?? STAGE_META.Research;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-card-border rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing select-none ${isDragging ? "opacity-50" : "hover-elevate"}`}
      data-testid={`job-card-${job.id}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-snug line-clamp-2">{job.hook ?? job.details ?? "Pipeline job"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className={`text-xs ${statusColors[job.status]}`}>{job.status}</Badge>
        {job.progress > 0 && job.progress < 100 && (
          <span className="text-xs text-muted-foreground">{job.progress}%</span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, jobs, isOver }: { stage: Stage; jobs: PipelineJob[]; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: stage });
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col min-w-[200px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${meta.color}`} />
        <span className="text-xs font-semibold">{stage}</span>
        <Badge variant="secondary" className={`text-xs ml-auto ${meta.badge}`}>{jobs.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[280px] rounded-lg border-2 border-dashed p-2 space-y-2 transition-colors ${isOver ? "border-primary/50 bg-primary/5" : "border-border/50 bg-muted/20"}`}
        data-testid={`column-${stage.toLowerCase()}`}
      >
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: jobs = [], isLoading } = useQuery<PipelineJob[]>({
    queryKey: ["/api/pipeline", campaignFilter],
    queryFn: async () => {
      const url = campaignFilter !== "all" ? `/api/pipeline?campaignId=${campaignFilter}` : "/api/pipeline";
      const res = await fetch(url);
      return res.json();
    },
    refetchInterval: 3000,
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) =>
      apiRequest("PATCH", `/api/pipeline/${id}`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline"] });
    },
    onError: () => toast({ title: "Failed to move job", variant: "destructive" }),
  });

  const addJobMutation = useMutation({
    mutationFn: async (stage: Stage) => {
      const campaignId = campaigns?.[0]?.id;
      if (!campaignId) throw new Error("No campaign");
      return apiRequest("POST", "/api/pipeline", {
        campaignId,
        stage,
        status: "pending",
        progress: 0,
        hook: "New content job",
        details: `New ${stage} job`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pipeline"] }),
  });

  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.stage === s);
    return acc;
  }, {} as Record<Stage, PipelineJob[]>);

  const activeJob = activeId ? jobs.find(j => j.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function onDragOver(e: any) {
    setOverId(e.over?.id ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    if (!e.over) return;
    const jobId = e.active.id as string;
    const newStage = e.over.id as string;
    if (STAGES.includes(newStage as Stage)) {
      const job = jobs.find(j => j.id === jobId);
      if (job && job.stage !== newStage) {
        moveMutation.mutate({ id: jobId, stage: newStage });
      }
    }
  }

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const runningJobs = jobs.filter(j => j.status === "running").length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-pipeline">
            <GitBranch className="w-6 h-6 text-primary" />
            Content Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Drag jobs between stages to move them through the workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-pipeline-campaign">
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {campaigns?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Jobs", value: totalJobs, icon: GitBranch, color: "text-primary" },
          { label: "Running", value: runningJobs, icon: Zap, color: "text-blue-500" },
          { label: "Completed", value: completedJobs, icon: CheckCircle2, color: "text-emerald-500" },
        ].map(s => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {STAGES.map(s => <Skeleton key={s} className="h-80 flex-1 rounded-xl" />)}
        </div>
      ) : (
        <DndContext
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          collisionDetection={closestCenter}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                jobs={grouped[stage]}
                isOver={overId === stage}
              />
            ))}
          </div>
          <DragOverlay>
            {activeJob ? (
              <div className="bg-card border border-card-border rounded-lg p-3 shadow-xl w-[200px] rotate-2 opacity-90">
                <p className="text-xs font-medium line-clamp-2">{activeJob.hook ?? activeJob.details ?? "Job"}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground self-center">Quick add:</span>
        {STAGES.map(stage => (
          <Button
            key={stage}
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={() => addJobMutation.mutate(stage)}
            disabled={addJobMutation.isPending}
            data-testid={`button-add-${stage.toLowerCase()}`}
          >
            <Plus className="w-3 h-3" /> {stage}
          </Button>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock } from "lucide-react";
import type { Agent, Campaign, Video } from "@shared/schema";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AGENT_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500",
  "bg-amber-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function generateScheduleForAgent(agent: Agent, weekOffset: number): Array<{ day: number; hour: number; agentId: string }> {
  const slots: Array<{ day: number; hour: number; agentId: string }> = [];
  const postsPerDay = agent.postsPerDay || 3;
  const postHours = [9, 12, 15, 18, 20].slice(0, postsPerDay);

  for (let day = 0; day < 7; day++) {
    const hash = (agent.id.charCodeAt(0) + day + weekOffset) % 3;
    const activeHours = postHours.filter((_, i) => (i + hash) % 2 === 0).slice(0, Math.ceil(postsPerDay / 2));
    for (const hour of activeHours) {
      slots.push({ day, hour, agentId: agent.id });
    }
  }
  return slots;
}

export default function ContentCalendar() {
  const [view, setView] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [campaignFilter, setCampaignFilter] = useState("all");

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: videos } = useQuery<Video[]>({ queryKey: ["/api/videos"] });

  const now = new Date(2026, 1, 21);
  const currentYear = now.getFullYear();
  const currentMonth = (now.getMonth() + monthOffset + 12) % 12;
  const currentMonthYear = currentYear + Math.floor((now.getMonth() + monthOffset) / 12);

  const filteredAgents = (agents ?? []).filter(a =>
    a.status === "active" && (campaignFilter === "all" || a.campaignId === campaignFilter)
  );

  const agentColorMap = new Map<string, string>();
  filteredAgents.forEach((a, i) => agentColorMap.set(a.id, AGENT_COLORS[i % AGENT_COLORS.length]));

  const allSlots = filteredAgents.flatMap(a => generateScheduleForAgent(a, weekOffset));

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + weekOffset * 7 - now.getDay() + 1);

  const weekLabel = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.getDate();
  });

  const totalPostsThisWeek = allSlots.length;
  const totalAgentsActive = filteredAgents.length;

  const { firstDay, daysInMonth } = getMonthDays(currentMonthYear, currentMonth);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-calendar">
            <CalIcon className="w-6 h-6 text-primary" />
            Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule overview for all active AI agents
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-calendar-campaign">
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {campaigns?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setView("week")}
              data-testid="button-view-week"
            >
              Week
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setView("month")}
              data-testid="button-view-month"
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Agents", value: totalAgentsActive, color: "text-primary" },
          { label: "Posts This Week", value: totalPostsThisWeek, color: "text-emerald-500" },
          { label: "Avg Posts/Day", value: Math.round(totalPostsThisWeek / 7), color: "text-violet-500" },
        ].map(s => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => view === "week" ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1)}
          data-testid="button-prev"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[140px] text-center">
          {view === "week"
            ? `Week of Feb ${weekLabel[0]}–${weekLabel[6]}, 2026`
            : `${MONTHS[currentMonth]} ${currentMonthYear}`
          }
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => view === "week" ? setWeekOffset(w => w + 1) : setMonthOffset(m => m + 1)}
          data-testid="button-next"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs ml-auto"
          onClick={() => { setWeekOffset(0); setMonthOffset(0); }}
          data-testid="button-today"
        >
          Today
        </Button>
      </div>

      {agentsLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : view === "week" ? (
        /* ─── WEEK VIEW ─────────────────────────────────────── */
        <Card className="border-card-border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b border-border bg-muted/30">
                <div className="p-3 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time
                </div>
                {DAYS.map((day, i) => (
                  <div key={day} className="p-3 text-center border-l border-border/50">
                    <div className="text-xs font-semibold">{day}</div>
                    <div className="text-xs text-muted-foreground">{weekLabel[i]}</div>
                  </div>
                ))}
              </div>

              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/30 min-h-[44px]">
                  <div className="p-2 text-xs text-muted-foreground flex items-start pt-2.5">
                    {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const slotsHere = allSlots.filter(s => s.day === dayIdx && s.hour === hour);
                    return (
                      <div key={dayIdx} className="border-l border-border/30 p-1 space-y-0.5">
                        {slotsHere.map((slot, si) => {
                          const agent = filteredAgents.find(a => a.id === slot.agentId);
                          const color = agentColorMap.get(slot.agentId) ?? "bg-primary";
                          if (!agent) return null;
                          return (
                            <div
                              key={si}
                              className={`${color} text-white text-xs px-1.5 py-0.5 rounded truncate cursor-default`}
                              title={`${agent.name} — ${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "pm" : "am"}`}
                              data-testid={`cal-slot-${agent.id}-${dayIdx}-${hour}`}
                            >
                              {agent.name.split(" ")[0]}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        /* ─── MONTH VIEW ─────────────────────────────────────── */
        <Card className="border-card-border overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {MONTH_DAYS.map(d => (
              <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/30 bg-muted/10" />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayOfWeek = (firstDay + i) % 7;
              const agentsPostingToday = filteredAgents.filter((_, ai) => {
                const seed = (ai + day) % 3;
                return seed !== 2;
              });
              const isToday = day === 21 && currentMonth === 1 && monthOffset === 0;
              return (
                <div
                  key={day}
                  className={`min-h-[80px] border-b border-r border-border/30 p-1 ${isToday ? "bg-primary/5" : ""}`}
                  data-testid={`cal-month-day-${day}`}
                >
                  <div className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {agentsPostingToday.slice(0, 3).map((agent, ai) => (
                      <div
                        key={agent.id}
                        className={`${agentColorMap.get(agent.id) ?? "bg-primary"} text-white text-xs px-1 py-0.5 rounded truncate`}
                        title={agent.name}
                      >
                        {agent.name.split(" ")[0]}
                      </div>
                    ))}
                    {agentsPostingToday.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">+{agentsPostingToday.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Agent Legend */}
      {filteredAgents.length > 0 && (
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground mr-2">Agents:</span>
              {filteredAgents.map((agent, i) => (
                <div key={agent.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs" data-testid={`legend-${agent.id}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${agentColorMap.get(agent.id) ?? "bg-primary"}`} />
                  {agent.name}
                  <span className="text-muted-foreground">({agent.postsPerDay}/day)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

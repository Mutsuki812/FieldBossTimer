import { useState, useEffect, useRef } from "react";
import { BossCard } from "@/components/BossCard";
import { FeedbackSection } from "@/components/FeedbackForm";
import { useReports } from "@/hooks/use-reports";
import { useSchedules } from "@/hooks/use-schedules";
import { useTaiwanTime } from "@/hooks/use-time";
import { formatTW, playReminderBeep } from "@/lib/time";
import { Clock, MapPin, Search, Zap, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

// ============================================================
// ★ 在這裡設定「即時回報系統」的開放時間段（台灣時間 - 指定特定日期）
//
// 格式說明：year, month, day, hour, minute, second 均為台灣時間
//
// 範例：2026/3/20 20:00:00 ~ 2026/3/21 02:00:00 開放即時回報
//   { start: { year: 2026, month: 3, day: 20, hour: 20, minute: 0, second: 0 },
//     end:   { year: 2026, month: 3, day: 21, hour:  2, minute: 0, second: 0 } }
// ============================================================

type WindowDT = {
  year: number;
  month: number; // 1~12
  day: number;
  hour: number;
  minute: number;
  second?: number;
};

type RealtimeWindow = { start: WindowDT; end: WindowDT };

const REALTIME_WINDOWS: RealtimeWindow[] = [
  // 在這裡填入您的時間段設定
  // { start: { year: 2026, month: 3, day: 25, hour: 10, minute: 59, second: 59 },
  //   end:   { year: 2026, month: 4, day: 1, hour:  5, minute: 59, second: 59 } },
];
// ============================================================

function windowDTtoMs(dt: WindowDT): number {
  return new Date(
    dt.year,
    dt.month - 1,
    dt.day,
    dt.hour,
    dt.minute,
    dt.second ?? 0,
    0,
  ).getTime();
}

const BOSSES = [
  { type: "suspicious_ritual", name: "可疑的儀式", theme: "boss-card-purple" },
  { type: "baiqing", name: "白青野王", theme: "boss-card-green" },
  { type: "xianhuan", name: "仙幻島野王", theme: "boss-card-gold" },
] as const;

const WEEKDAYS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

function isInRealtimeWindow(date: Date): boolean {
  const nowMs = date.getTime();
  return REALTIME_WINDOWS.some((w) => {
    const startMs = windowDTtoMs(w.start);
    const endMs = windowDTtoMs(w.end);
    return nowMs >= startMs && nowMs <= endMs;
  });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatWindowDT(dt: WindowDT): string {
  const parts: string[] = [];
  if (dt.year !== undefined) parts.push(`${dt.year}/`);
  if (dt.month !== undefined) parts.push(`${pad2(dt.month)}/`);
  if (dt.day !== undefined) parts.push(`${pad2(dt.day)} `);
  parts.push(`${pad2(dt.hour)}:${pad2(dt.minute)}`);
  if (dt.second !== undefined) parts.push(`:${pad2(dt.second)}`);
  return parts.join("");
}

function getNextWindowChange(
  date: Date,
): { label: string; secsLeft: number } | null {
  const nowMs = date.getTime();
  const inWindow = isInRealtimeWindow(date);

  let bestDiff = Infinity;
  let bestLabel = "";

  for (const w of REALTIME_WINDOWS) {
    const startMs = windowDTtoMs(w.start);
    const endMs = windowDTtoMs(w.end);
    if (inWindow) {
      const diff = (endMs - nowMs) / 1000;
      if (diff >= 0 && diff < bestDiff) {
        bestDiff = diff;
        bestLabel = formatWindowDT(w.end);
      }
    } else {
      const diff = (startMs - nowMs) / 1000;
      if (diff >= 0 && diff < bestDiff) {
        bestDiff = diff;
        bestLabel = formatWindowDT(w.start);
      }
    }
  }

  if (bestDiff === Infinity) return null;
  return { label: bestLabel, secsLeft: Math.round(bestDiff) };
}

export default function Home() {
  const twTime = useTaiwanTime();
  const todayDayOfWeek = twTime.getDay();
  const currentHour = twTime.getHours();

  const isRealtime = isInRealtimeWindow(twTime);
  const nextChange = getNextWindowChange(twTime);

  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: schedules, isLoading: schedulesLoading } =
    useSchedules(todayDayOfWeek);

  const [expandedBoss, setExpandedBoss] = useState<Record<string, boolean>>({});
  const beepedIds = useRef<Set<number>>(new Set());

  // Audio reminder logic (5 minutes before schedule) — using ref to avoid re-render loop
  useEffect(() => {
    if (!schedules) return;
    const minutes = twTime.getMinutes();
    const hours = twTime.getHours();
    schedules.forEach((schedule) => {
      const [schHour, schMinute] = schedule.appearanceTime
        .split(":")
        .map(Number);
      const currentTotalMins = hours * 60 + minutes;
      const schTotalMins = schHour * 60 + schMinute;
      const diff = schTotalMins - currentTotalMins;
      const key = schedule.id * 10000 + hours * 60 + minutes;
      if (diff === 5 && !beepedIds.current.has(key)) {
        playReminderBeep();
        beepedIds.current.add(key);
      }
    });
  }, [twTime, schedules]);

  const translateBossType = (type: string) =>
    BOSSES.find((b) => b.type === type)?.name || type;

  // Group schedules by boss type and time period
  const schedulesByBoss = BOSSES.reduce((acc, boss) => {
    const bossSchedules = [...(schedules || [])]
      .filter((s) => s.bossType === boss.type)
      .sort((a, b) => a.appearanceTime.localeCompare(b.appearanceTime));
    const cur = bossSchedules.filter((s) => {
      const [h] = s.appearanceTime.split(":").map(Number);
      return h === currentHour;
    });
    const next = bossSchedules.filter((s) => {
      const [h] = s.appearanceTime.split(":").map(Number);
      return h === currentHour + 1 || h === currentHour + 2;
    });
    const others = bossSchedules.filter((s) => {
      const [h] = s.appearanceTime.split(":").map(Number);
      return (
        h !== currentHour &&
        h !== currentHour + 1 &&
        h !== currentHour + 2 &&
        h >= currentHour
      );
    });
    acc[boss.type] = { cur, next, others };
    return acc;
  }, {} as Record<string, { cur: typeof schedules; next: typeof schedules; others: typeof schedules }>);

  return (
    <div className="min-h-screen pb-20 selection:bg-primary/20">
      {/* Header Area */}
      <header className="pt-10 pb-6 px-4 max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
            <Clock className="w-4 h-4" /> [台灣時間]
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-foreground text-center mb-2 tracking-wide">
            《劍靈 NEO》野王時刻表
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase mb-6 font-mono">
            {formatTW(twTime, "yyyy.MM.dd")} ~ Season 1
          </p>

          <div className="text-center bg-card shadow-sm border border-border rounded-xl px-8 py-5 min-w-[280px]">
            <div className="text-sm text-muted-foreground font-medium mb-1">
              {formatTW(twTime, "yyyy/MM/dd")} ({WEEKDAYS[todayDayOfWeek]})
            </div>
            <div
              className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-foreground"
              suppressHydrationWarning
            >
              {formatTW(twTime, "HH:mm:ss")}
            </div>
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-medium shadow-sm ${
              isRealtime
                ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            {isRealtime ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <Zap className="w-4 h-4" />
                即時回報系統開放中
                {nextChange && (
                  <span className="ml-1 text-xs opacity-70">
                    （{nextChange.label} 結束）
                  </span>
                )}
              </>
            ) : (
              <>
                <CalendarDays className="w-4 h-4" />
                野王出現時間表模式
                {nextChange && (
                  <span className="ml-1 text-xs opacity-70">
                    （{nextChange.label} 開放即時回報）
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-2 text-sm text-muted-foreground/80 bg-background border border-border/50 p-4 rounded-lg shadow-sm">
          <p>
            📌 網站使用方式：本站時間與計算均以{" "}
            <strong className="text-foreground">台灣時間</strong> 為基準。
          </p>
          <p>📝 資料來源感謝：熱心玩家社群即時回報與彙整。</p>
          <p>🔔 提示音：時刻表會在野王出現前 5 分鐘發出音效提醒。</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4">
        {/* ── 即時回報系統（限定時間內） ── */}
        {isRealtime && (
          <section className="animate-in fade-in-50 duration-500">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h2 className="text-xl font-serif font-bold text-foreground">
                即時回報系統
              </h2>
              <Badge variant="secondary" className="text-xs">
                橫向卡片
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BOSSES.map((boss) => (
                <BossCard
                  key={boss.type}
                  type={boss.type}
                  name={boss.name}
                  themeClass={boss.theme}
                  reports={
                    reports?.filter((r) => r.bossType === boss.type) || []
                  }
                  currentTime={twTime}
                />
              ))}
            </div>
            {reportsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[400px] rounded-2xl" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── 野王出現時間表（限定時間外） ── */}
        {!isRealtime && (
          <section className="animate-in fade-in-50 duration-500">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h2 className="text-xl font-serif font-bold text-foreground">
                野王出現時間表
              </h2>
            </div>
            {schedulesLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-96 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {BOSSES.map((boss) => {
                  const data = schedulesByBoss[boss.type];
                  const isExpanded = expandedBoss[boss.type] ?? false;
                  return (
                    <div key={boss.type} className="flex flex-col gap-4">
                      {/* Boss Block Header */}
                      <div className={`${boss.theme} rounded-xl p-5 shadow-md`}>
                        <h3 className="text-lg font-serif font-bold text-white">
                          {boss.name}
                        </h3>
                      </div>

                      {/* Current Hour */}
                      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          當前小時
                        </h4>
                        <div className="space-y-2">
                          {data.cur.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground text-xs bg-muted/20 rounded">
                              無
                            </div>
                          ) : (
                            data.cur.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2.5 bg-background rounded border border-border/60 text-sm"
                              >
                                <span className="font-mono font-bold">{s.appearanceTime}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {s.location}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Next 2 Hours */}
                      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-foreground/80 mb-3">
                          後兩小時
                        </h4>
                        <div className="space-y-2">
                          {data.next.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground text-xs bg-muted/20 rounded">
                              無
                            </div>
                          ) : (
                            data.next.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2.5 bg-background rounded border border-border/60 text-sm"
                              >
                                <span className="font-mono text-xs text-muted-foreground">
                                  {s.appearanceTime}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {s.location}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Other Times */}
                      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8"
                          onClick={() =>
                            setExpandedBoss((prev) => ({
                              ...prev,
                              [boss.type]: !prev[boss.type],
                            }))
                          }
                          data-testid={`button-toggle-${boss.type}`}
                        >
                          <Search className="w-3 h-3 mr-1" />
                          {isExpanded ? "隱藏" : "顯示"}其他時間
                        </Button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                            {data.others.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground text-xs">
                                無
                              </div>
                            ) : (
                              data.others.map((s) => (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between p-2 bg-background/50 rounded text-xs border border-border/40"
                                >
                                  <span className="font-mono text-muted-foreground/80">
                                    {s.appearanceTime}
                                  </span>
                                  <span className="text-muted-foreground/70">
                                    {s.location}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="mt-12">
          <FeedbackSection />
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BossCard } from "@/components/BossCard";
import { FeedbackSection } from "@/components/FeedbackForm";
import { useReports } from "@/hooks/use-reports";
import { useSchedules } from "@/hooks/use-schedules";
import { useTaiwanTime } from "@/hooks/use-time";
import { formatTW, playReminderBeep } from "@/lib/time";
import { CalendarDays, Clock, MapPin, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const BOSSES = [
  { type: 'suspicious_ritual', name: '可疑的儀式', theme: 'boss-card-purple' },
  { type: 'baiqing', name: '白青野王', theme: 'boss-card-green' },
  { type: 'xianhuan', name: '仙幻島野王', theme: 'boss-card-gold' }
] as const;

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export default function Home() {
  const twTime = useTaiwanTime();
  const todayDayOfWeek = twTime.getDay();
  const currentHour = twTime.getHours();
  
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: schedules, isLoading: schedulesLoading } = useSchedules(todayDayOfWeek);
  
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [lastBeepedSchedule, setLastBeepedSchedule] = useState<number | null>(null);

  // Audio reminder logic (5 minutes before schedule)
  useEffect(() => {
    if (!schedules) return;
    
    const minutes = twTime.getMinutes();
    const hours = twTime.getHours();
    
    schedules.forEach(schedule => {
      const [schHour, schMinute] = schedule.appearanceTime.split(':').map(Number);
      
      // Calculate minutes diff
      const currentTotalMins = hours * 60 + minutes;
      const schTotalMins = schHour * 60 + schMinute;
      const diff = schTotalMins - currentTotalMins;
      
      // If exactly 5 minutes away and haven't beeped for this schedule ID yet
      if (diff === 5 && lastBeepedSchedule !== schedule.id) {
        playReminderBeep();
        setLastBeepedSchedule(schedule.id);
      }
    });
  }, [twTime, schedules, lastBeepedSchedule]);

  // Group schedules
  const sortedSchedules = [...(schedules || [])].sort((a, b) => a.appearanceTime.localeCompare(b.appearanceTime));
  
  const currentHourSchedules = sortedSchedules.filter(s => {
    const [h] = s.appearanceTime.split(':').map(Number);
    return h === currentHour;
  });
  
  const nextTwoHoursSchedules = sortedSchedules.filter(s => {
    const [h] = s.appearanceTime.split(':').map(Number);
    return h === currentHour + 1 || h === currentHour + 2;
  });
  
  const otherSchedules = sortedSchedules.filter(s => {
    const [h] = s.appearanceTime.split(':').map(Number);
    return h !== currentHour && h !== currentHour + 1 && h !== currentHour + 2 && h >= currentHour;
  });

  const translateBossType = (type: string) => BOSSES.find(b => b.type === type)?.name || type;

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
            {formatTW(twTime, 'yyyy.MM.dd')} ~ Season 1
          </p>

          <div className="text-center bg-card shadow-sm border border-border rounded-xl px-8 py-5 min-w-[280px]">
            <div className="text-sm text-muted-foreground font-medium mb-1">
              {formatTW(twTime, 'yyyy/MM/dd')} ({WEEKDAYS[todayDayOfWeek]})
            </div>
            <div className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-foreground" suppressHydrationWarning>
              {formatTW(twTime, 'HH:mm:ss')}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-2 text-sm text-muted-foreground/80 bg-background border border-border/50 p-4 rounded-lg shadow-sm">
          <p>📌 網站使用方式：本站時間與計算均以 <strong className="text-foreground">台灣時間</strong> 為基準。</p>
          <p>📝 資料來源感謝：熱心玩家社群即時回報與彙整。</p>
          <p>🔔 提示音：時刻表會在野王出現前 5 分鐘發出音效提醒。</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4">
        <Tabs defaultValue="realtime" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-card border border-border p-1 shadow-sm rounded-xl">
              <TabsTrigger value="realtime" className="rounded-lg px-8 py-2.5 font-serif text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">
                即時回報系統
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-lg px-8 py-2.5 font-serif text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">
                野王出現時間表
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="realtime" className="focus-visible:outline-none animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BOSSES.map((boss) => (
                <BossCard
                  key={boss.type}
                  type={boss.type}
                  name={boss.name}
                  themeClass={boss.theme}
                  reports={reports?.filter(r => r.bossType === boss.type) || []}
                  currentTime={twTime}
                />
              ))}
            </div>
            {reportsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-[400px] rounded-2xl" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="focus-visible:outline-none animate-in fade-in-50 duration-500">
            <div className="max-w-3xl mx-auto">
              {schedulesLoading ? (
                <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
              ) : (
                <div className="space-y-8">
                  {/* Current Hour */}
                  <section>
                    <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2 text-primary border-b border-primary/20 pb-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      當前小時 ({currentHour}:00 - {currentHour}:59)
                    </h2>
                    <div className="grid gap-3">
                      {currentHourSchedules.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">此時段無野王出沒</div>
                      ) : (
                        currentHourSchedules.map(s => (
                          <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                              <div className="font-mono text-xl font-bold text-foreground bg-background px-3 py-1 rounded-md border border-border">{s.appearanceTime}</div>
                              <div className="font-serif text-lg font-medium">{translateBossType(s.bossType)}</div>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm bg-muted/30 px-3 py-1.5 rounded-full">
                              <MapPin className="w-4 h-4" /> {s.location}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Next 2 Hours */}
                  <section>
                    <h2 className="text-lg font-serif font-semibold mb-4 text-foreground/80 border-b border-border/50 pb-2">
                      接下來兩小時
                    </h2>
                    <div className="grid gap-3">
                      {nextTwoHoursSchedules.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">無資料</div>
                      ) : (
                        nextTwoHoursSchedules.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/60">
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-muted-foreground">{s.appearanceTime}</span>
                              <span className="font-medium text-foreground/90">{translateBossType(s.bossType)}</span>
                            </div>
                            <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{s.location}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Other Times */}
                  <section>
                    <Button 
                      variant="outline" 
                      className="w-full font-serif border-dashed hover:border-solid hover:bg-muted/50"
                      onClick={() => setShowAllSchedules(!showAllSchedules)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {showAllSchedules ? "隱藏今日其餘時間" : "顯示今日其餘時間"}
                    </Button>
                    
                    {showAllSchedules && (
                      <div className="mt-4 grid gap-2 animate-in slide-in-from-top-4 duration-300">
                        {otherSchedules.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">今日已無其他野王</div>
                        ) : (
                          otherSchedules.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2.5 px-4 bg-background/50 rounded-lg text-sm">
                              <div className="flex items-center gap-4">
                                <span className="font-mono text-muted-foreground opacity-70">{s.appearanceTime}</span>
                                <span className="text-foreground/80">{translateBossType(s.bossType)}</span>
                              </div>
                              <span className="text-muted-foreground/70">{s.location}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <FeedbackSection />
      </main>
    </div>
  );
}

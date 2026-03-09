import { type Report } from "@shared/schema";
import { ReportDialog } from "./ReportDialog";
import { DeleteReportDialog } from "./DeleteReportDialog";
import { formatTW } from "@/lib/time";
import { addHours, differenceInSeconds } from "date-fns";
import { useEffect, useState } from "react";

interface BossCardProps {
  type: 'suspicious_ritual' | 'baiqing' | 'xianhuan';
  name: string;
  themeClass: string;
  reports: Report[];
  currentTime: Date;
}

export function BossCard({ type, name, themeClass, reports, currentTime }: BossCardProps) {
  const sortedReports = [...reports].sort((a, b) => b.appearanceTime.getTime() - a.appearanceTime.getTime());
  const latestReport = sortedReports[0] as Report | undefined;
  
  // Calculate prediction and countdown
  let predictionDate: Date | null = null;
  let countdownText = "等待回報";
  
  if (latestReport) {
    if (type !== 'suspicious_ritual') {
      predictionDate = addHours(latestReport.appearanceTime, 2);
      
      const diffSecs = differenceInSeconds(predictionDate, currentTime);
      if (diffSecs > 0) {
        const hrs = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        countdownText = `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
      } else if (diffSecs > -3600) {
         countdownText = "已超過預測時間";
      } else {
         countdownText = "等待新回報";
      }
    } else {
      countdownText = "無法預測";
    }
  }

  const getMethodBadge = (method: string) => {
    switch(method) {
      case 'system': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">系統出字</span>;
      case 'thunder': return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">打雷中</span>;
      default: return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">不確定</span>;
    }
  };

  return (
    <div className={`flex flex-col bg-card rounded-2xl p-5 border-2 ${themeClass} transition-all duration-300`}>
      <div className="flex-1">
        <h3 className="text-xl font-serif font-bold text-center mb-4 text-foreground/90">{name}</h3>
        
        <div className="bg-background/60 rounded-xl p-4 mb-4 backdrop-blur-sm border border-border/50 text-center shadow-inner">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">下次預測時間</p>
          {predictionDate ? (
            <div className="text-3xl font-mono font-semibold tracking-tight text-primary">
              {formatTW(predictionDate, 'HH:mm')}
            </div>
          ) : (
            <div className="text-lg font-medium text-muted-foreground py-1">
              {type === 'suspicious_ritual' ? '上一支出現時間' : '--:--'}
            </div>
          )}
          
          <div className="mt-2 text-sm font-medium h-6 text-foreground/80 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></span>
            {countdownText}
          </div>
          
          {type === 'suspicious_ritual' && latestReport && (
            <div className="mt-1 text-sm font-mono text-muted-foreground">
              ({formatTW(latestReport.appearanceTime, 'HH:mm')})
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between border-b border-border/50 pb-1">
            <span>最近回報紀錄</span>
            <span className="font-normal opacity-70">{sortedReports.length} 筆</span>
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {sortedReports.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4 italic">尚無資料</p>
            ) : (
              sortedReports.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-background border border-border/50 rounded-lg p-2 text-sm group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{formatTW(r.appearanceTime, 'HH:mm')}</span>
                    {getMethodBadge(r.appearanceMethod)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]" title={r.reporterName}>{r.reporterName}</span>
                    <DeleteReportDialog reportId={r.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-2">
        <ReportDialog bossType={type} bossName={name} />
      </div>
    </div>
  );
}

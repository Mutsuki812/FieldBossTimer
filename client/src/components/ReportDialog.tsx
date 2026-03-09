import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateReport } from "@/hooks/use-reports";
import { getTWTime, formatTW } from "@/lib/time";
import { set } from "date-fns";
import { AlertCircle, Clock, Save, User } from "lucide-react";

export function ReportDialog({ bossType, bossName }: { bossType: string; bossName: string }) {
  const [open, setOpen] = useState(false);
  const { mutate: createReport, isPending } = useCreateReport();
  
  // Default time to current TW time (HH:mm)
  const defaultTime = formatTW(getTWTime(), 'HH:mm');
  
  const [timeStr, setTimeStr] = useState(defaultTime);
  const [method, setMethod] = useState("system");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeStr || !name || !token) return;

    // Convert timeStr ("HH:mm") to full Date object representing today in TW time
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateInTw = set(getTWTime(), { hours, minutes, seconds: 0, milliseconds: 0 });

    createReport(
      {
        bossType,
        appearanceTime: dateInTw.toISOString(),
        appearanceMethod: method,
        reporterName: name,
        token: token,
      },
      {
        onSuccess: () => setOpen(false)
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-background hover:bg-muted font-serif">
          回報 {bossName}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-muted">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-wider text-center text-foreground pb-2 border-b border-border">
            回報野王出現
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /> 出現時間 (台灣時間)</Label>
            <Input 
              type="time" 
              required
              value={timeStr} 
              onChange={(e) => setTimeStr(e.target.value)}
              className="font-mono text-lg bg-background"
            />
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground"><AlertCircle className="w-4 h-4" /> 出現方式</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="選擇出現方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">系統出字</SelectItem>
                <SelectItem value="thunder">打雷中</SelectItem>
                <SelectItem value="unsure">不確定</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /> 回報者名稱</Label>
            <Input 
              required 
              placeholder="您的暱稱" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-muted-foreground">編輯密碼 (Token)</Label>
            <Input 
              required 
              type="password"
              placeholder="用於日後刪除錯誤回報" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-background font-mono"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full flex items-center gap-2 mt-2">
            <Save className="w-4 h-4" />
            {isPending ? "送出中..." : "確認回報"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

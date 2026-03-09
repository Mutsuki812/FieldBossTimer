import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteReport } from "@/hooks/use-reports";
import { Trash2 } from "lucide-react";

export function DeleteReportDialog({ reportId }: { reportId: number }) {
  const [open, setOpen] = useState(false);
  const { mutate: deleteReport, isPending } = useDeleteReport();
  
  const [name, setName] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !token) return;

    deleteReport(
      { id: reportId, token, reporterName: name },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">刪除回報紀錄</DialogTitle>
          <DialogDescription>
            請輸入回報時填寫的名稱與密碼，以驗證刪除權限。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid gap-2">
            <Label>回報者名稱</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>編輯密碼</Label>
            <Input required type="password" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>

          <Button type="submit" variant="destructive" disabled={isPending} className="w-full mt-2">
            {isPending ? "刪除中..." : "確認刪除"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

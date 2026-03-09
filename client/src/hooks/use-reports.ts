import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Report } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Helper to convert string dates to Date objects when parsing JSON responses
function parseReportDates(reports: any[]): Report[] {
  return reports.map(r => ({
    ...r,
    appearanceTime: new Date(r.appearanceTime),
    createdAt: r.createdAt ? new Date(r.createdAt) : null
  }));
}

export function useReports() {
  return useQuery({
    queryKey: [api.reports.list.path],
    queryFn: async () => {
      const res = await fetch(api.reports.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const raw = await res.json();
      return parseReportDates(raw);
    },
    refetchInterval: 15000, // Poll every 15s to keep real-time fresh
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create report");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      toast({ title: "回報成功", description: "已更新野王出現時間！", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "回報失敗", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, token, reporterName }: { id: number, token: string, reporterName: string }) => {
      const url = buildUrl(api.reports.delete.path, { id });
      const res = await fetch(url, {
        method: api.reports.delete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reporterName }),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("密碼或回報者名稱錯誤");
        throw new Error("Failed to delete report");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      toast({ title: "刪除成功", description: "回報紀錄已刪除。" });
    },
    onError: (error: Error) => {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  });
}

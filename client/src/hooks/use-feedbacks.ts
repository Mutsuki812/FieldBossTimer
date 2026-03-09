import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Feedback } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function parseFeedbackDates(feedbacks: any[]): Feedback[] {
  return feedbacks.map(f => ({
    ...f,
    createdAt: f.createdAt ? new Date(f.createdAt) : null
  }));
}

export function useFeedbacks() {
  return useQuery({
    queryKey: [api.feedbacks.list.path],
    queryFn: async () => {
      const res = await fetch(api.feedbacks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feedbacks");
      return parseFeedbackDates(await res.json());
    },
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.feedbacks.create.path, {
        method: api.feedbacks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.feedbacks.list.path] });
      toast({ title: "留言成功", description: "感謝您的回報與建議！" });
    },
    onError: () => {
      toast({ title: "留言失敗", description: "請稍後再試。", variant: "destructive" });
    }
  });
}

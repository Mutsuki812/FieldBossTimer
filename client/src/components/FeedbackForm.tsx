import { useState } from "react";
import { useCreateFeedback, useFeedbacks } from "@/hooks/use-feedbacks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatTW } from "@/lib/time";
import { MessageSquare, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FeedbackSection() {
  const { data: feedbacks, isLoading } = useFeedbacks();
  const { mutate: createFeedback, isPending } = useCreateFeedback();
  
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState<"general" | "schedule_error">("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !author) return;
    createFeedback({ type, content, author }, {
      onSuccess: () => {
        setContent("");
        setAuthor("");
      }
    });
  };

  return (
    <div className="mt-12 bg-card border border-border rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-serif mb-6 flex items-center gap-2 border-b border-border pb-3">
        <MessageSquare className="w-5 h-5 text-primary" />
        留言板 / 錯誤回報
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-2">
            <Button
              type="button"
              variant={type === "general" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setType("general")}
            >
              一般留言
            </Button>
            <Button
              type="button"
              variant={type === "schedule_error" ? "destructive" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setType("schedule_error")}
            >
              <AlertTriangle className="w-4 h-4" /> 時間/地點錯誤
            </Button>
          </div>
          
          <Input 
            required 
            placeholder="您的暱稱" 
            value={author} 
            onChange={e => setAuthor(e.target.value)} 
            className="bg-background"
          />
          <Textarea 
            required 
            placeholder={type === "general" ? "想說些什麼？" : "請描述錯誤的時間或地點..."} 
            value={content} 
            onChange={e => setContent(e.target.value)}
            className="h-32 bg-background resize-none"
          />
          
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "送出中..." : "送出留言"}
          </Button>
        </form>

        {/* List */}
        <div className="bg-background rounded-lg border border-border p-4 h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : feedbacks?.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              尚無留言，成為第一個留言的人吧！
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks?.map(f => (
                <div key={f.id} className={`p-3 rounded-md text-sm border-l-2 ${f.type === 'schedule_error' ? 'bg-destructive/5 border-l-destructive' : 'bg-muted/30 border-l-primary'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-foreground">{f.author}</span>
                    <span className="text-xs text-muted-foreground">{f.createdAt ? formatTW(f.createdAt, 'MM/dd HH:mm') : ''}</span>
                  </div>
                  <p className="text-foreground/80 break-words whitespace-pre-wrap">{f.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

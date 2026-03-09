import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Schedule } from "@shared/schema";

export function useSchedules(dayOfWeek?: number) {
  return useQuery({
    queryKey: [api.schedules.list.path, dayOfWeek],
    queryFn: async () => {
      const url = dayOfWeek !== undefined 
        ? `${api.schedules.list.path}?dayOfWeek=${dayOfWeek}` 
        : api.schedules.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return (await res.json()) as Schedule[];
    },
  });
}

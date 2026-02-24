import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Activity {
  id: string;
  type: "case" | "evidence" | "query" | "view" | "delete" | "update";
  action: string;
  target: string;
  timestamp: string;
  userId: string;
}

interface ActivityStore {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
  clearActivities: () => void;
  getUserActivities: (userId: string) => Activity[];
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      
      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep last 100
        }));
      },
      
      clearActivities: () => set({ activities: [] }),
      
      getUserActivities: (userId: string) => {
        return get().activities.filter((activity) => activity.userId === userId);
      },
    }),
    {
      name: "activity-storage",
    }
  )
);

import React from "react";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

export const ScheduledEmails: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-400" />
          Scheduled Emails
        </h1>
        <p className="text-sm text-zinc-400">
          Emails currently waiting in the BullMQ Redis queue.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
          <CardDescription>Live state from PostgreSQL and BullMQ delayed sets.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No scheduled emails"
            description="All scheduled emails have been dispatched or no new jobs have been enqueued."
            actionLabel="Schedule Emails"
            onAction={() => {
              window.location.href = "/compose";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

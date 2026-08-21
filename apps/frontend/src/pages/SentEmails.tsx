import React from "react";
import { Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

export const SentEmails: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-emerald-400" />
          Sent Emails
        </h1>
        <p className="text-sm text-zinc-400">
          History of delivered emails with Ethereal preview links.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>Delivered emails sent via Ethereal SMTP.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No sent emails yet"
            description="Delivered emails will appear here once processed by the BullMQ worker."
            actionLabel="Compose Email"
            onAction={() => {
              window.location.href = "/compose";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

import React from "react";
import { MailPlus, UploadCloud, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";

export const Compose: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MailPlus className="w-6 h-6 text-brand-400" />
          Compose New Sequence
        </h1>
        <p className="text-sm text-zinc-400">
          Set up CSV recipient lists, scheduling delays, and hourly limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CSV Recipient Upload</CardTitle>
            <CardDescription>Upload a CSV file containing recipient emails.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<UploadCloud className="w-6 h-6 text-brand-400" />}
              title="Upload CSV Leads"
              description="Drag and drop your .csv file here or browse files."
              actionLabel="Select File"
              onAction={() => alert("CSV upload will be wired in Phase 12")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequence Parameters</CardTitle>
            <CardDescription>Configure drip delay and rate limit rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Subject Line" placeholder="Quick question regarding your outbound strategy" />
            <Input label="Delay Between Emails (seconds)" defaultValue="2" type="number" />
            <Input label="Hourly Cap" defaultValue="200" type="number" />
            <Button variant="gradient" fullWidth leftIcon={<Send className="w-4 h-4" />}>
              Schedule Sequence
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

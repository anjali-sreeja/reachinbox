import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MailPlus, UploadCloud, Send, X, FileText, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Sender, ApiResponse } from "../types";

// Extracts every valid-looking email address from arbitrary CSV/text content,
// regardless of column order, headers, or delimiter style.
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) || [];
  return Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
}

export const Compose: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [manualRecipient, setManualRecipient] = useState<string>("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingSenders, setIsLoadingSenders] = useState<boolean>(true);

  useEffect(() => {
    const loadSenders = async () => {
      try {
        const res = await api.get<ApiResponse<Sender[]>>("/api/senders");
        if (res.data?.success) {
          const list = res.data.data || [];
          setSenders(list);
          if (list.length > 0) setSenderId(list[0].id);
        }
      } catch (err) {
        console.warn("Failed to load senders:", err);
        toastError("Network Error", "Unable to load sender accounts.");
      } finally {
        setIsLoadingSenders(false);
      }
    };
    void loadSenders();
  }, [toastError]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const emails = extractEmailsFromText(text);
        if (emails.length === 0) {
          toastError("No emails found", "That file didn't contain any valid email addresses.");
          return;
        }
        setRecipients((prev) => Array.from(new Set([...prev, ...emails])));
        setCsvFileName(file.name);
        toastSuccess("CSV parsed", `${emails.length} recipient(s) found in ${file.name}.`);
      };
      reader.onerror = () => {
        toastError("Read Error", "Could not read the selected file.");
      };
      reader.readAsText(file);
    },
    [toastError, toastSuccess]
  );

  const handleAddManualRecipient = () => {
    const emails = extractEmailsFromText(manualRecipient);
    if (emails.length === 0) {
      toastError("Invalid email", "Enter a valid email address.");
      return;
    }
    setRecipients((prev) => Array.from(new Set([...prev, ...emails])));
    setManualRecipient("");
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  const clearAllRecipients = () => {
    setRecipients([]);
    setCsvFileName("");
  };

  const resetForm = () => {
    setSubject("");
    setBody("");
    setRecipients([]);
    setCsvFileName("");
    setManualRecipient("");
    setDelaySeconds(2);
  };

  const handleSchedule = async () => {
    if (!senderId) {
      toastError("Missing sender", "No sender account is available yet.");
      return;
    }
    if (!subject.trim()) {
      toastError("Missing subject", "Please enter a subject line.");
      return;
    }
    if (!body.trim()) {
      toastError("Missing body", "Please write the email body.");
      return;
    }
    if (recipients.length === 0) {
      toastError("No recipients", "Add at least one recipient via CSV or manually.");
      return;
    }

    setIsSubmitting(true);

    // Start ~5s in the future so scheduling never races past `Date.now()`
    // by the time the request reaches the server, then stagger each
    // recipient by the configured delay.
    const baseTime = Date.now() + 5000;
    const safeDelayMs = Math.max(0, delaySeconds) * 1000;

    const results = await Promise.allSettled(
      recipients.map((recipient, index) =>
        api.post("/api/emails/schedule", {
          senderId,
          recipient,
          subject,
          body,
          scheduledAt: new Date(baseTime + index * safeDelayMs).toISOString(),
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    setIsSubmitting(false);

    if (succeeded > 0) {
      toastSuccess(
        "Sequence scheduled",
        `${succeeded} email(s) scheduled successfully${failed > 0 ? `, ${failed} failed` : ""}.`
      );
      resetForm();
      navigate("/scheduled");
    } else {
      toastError("Scheduling failed", "None of the emails could be scheduled. Please try again.");
    }
  };

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
            <CardTitle>Recipients</CardTitle>
            <CardDescription>Upload a CSV file or add recipients manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
            />

            {recipients.length === 0 ? (
              <EmptyState
                icon={<UploadCloud className="w-6 h-6 text-brand-400" />}
                title="Upload CSV Leads"
                description="Drag and drop your .csv file here or browse files."
                actionLabel="Select File"
                onAction={() => fileInputRef.current?.click()}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{recipients.length} recipient(s)</span>
                    {csvFileName && (
                      <span className="inline-flex items-center gap-1 text-zinc-500">
                        <FileText className="w-3 h-3" />
                        {csvFileName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Add more
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllRecipients}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {recipients.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between text-sm bg-surface-subtle border border-surface-border rounded-lg px-3 py-1.5"
                    >
                      <span className="truncate text-zinc-200">{email}</span>
                      <button
                        onClick={() => removeRecipient(email)}
                        className="text-zinc-500 hover:text-red-400 transition-colors shrink-0 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Input
                label="Add recipient manually"
                placeholder="jane@example.com"
                value={manualRecipient}
                onChange={(e) => setManualRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddManualRecipient();
                  }
                }}
              />
              <Button variant="secondary" onClick={handleAddManualRecipient}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequence Parameters</CardTitle>
            <CardDescription>Configure sender, message, and delay rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300 tracking-wide">
                Sender Account
              </label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                disabled={isLoadingSenders || senders.length === 0}
                className="w-full bg-surface-subtle border border-surface-border text-sm text-zinc-100 rounded-xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
              >
                {senders.length === 0 && <option value="">No senders available</option>}
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Subject Line"
              placeholder="Quick question regarding your outbound strategy"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300 tracking-wide">
                Email Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Hi {{firstName}}, I wanted to reach out about..."
                className="w-full bg-surface-subtle border border-surface-border text-sm text-zinc-100 placeholder:text-zinc-500 rounded-xl px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>

            <Input
              label="Delay Between Emails (seconds)"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value) || 0)}
              type="number"
              min={0}
            />

            <p className="text-[11px] text-zinc-500">
              The hourly send cap is enforced automatically by the server (configured via
              <code className="mx-1 px-1 py-0.5 rounded bg-surface-subtle border border-surface-border">
                EMAIL_HOURLY_LIMIT
              </code>
              ). Emails beyond the cap are rescheduled to the next hour window automatically.
            </p>

            <Button
              variant="gradient"
              fullWidth
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isSubmitting}
              onClick={handleSchedule}
            >
              Schedule Sequence ({recipients.length || 0})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

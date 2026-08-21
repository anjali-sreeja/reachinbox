import React, { useState, useEffect, useCallback } from "react";
import { Send, Mail, Calendar, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import type { Email, PaginatedApiResponse, PaginationMeta } from "../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";

const PAGE_SIZE = 20;

export const SentEmails: React.FC = () => {
  const { error: toastError } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchSent = useCallback(async () => {
    try {
      const res = await api.get<PaginatedApiResponse<Email>>(
        `/api/emails/sent?page=${page}&limit=${PAGE_SIZE}`
      );
      if (res.data?.success) {
        setEmails(res.data.data || []);
        setPagination(res.data.pagination || null);
      }
    } catch (err) {
      console.warn("Failed to fetch sent emails:", err);
      toastError("Network Error", "Unable to load sent emails from server.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, toastError]);

  useEffect(() => {
    setIsLoading(true);
    void fetchSent();
  }, [fetchSent]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchSent();
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-400" />
            Sent Emails
          </h1>
          <p className="text-sm text-zinc-400">
            History of delivered emails, sent via Ethereal SMTP.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          isLoading={isRefreshing}
          onClick={handleRefresh}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>Delivered emails sent via Ethereal SMTP.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : emails.length === 0 ? (
            <EmptyState
              title="No sent emails yet"
              description="Delivered emails will appear here once processed by the BullMQ worker."
              actionLabel="Compose Email"
              onAction={() => {
                window.location.href = "/compose";
              }}
            />
          ) : (
            <>
              <div className="divide-y divide-surface-border/60">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-surface-subtle/40 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {email.recipient}
                        </span>
                        <span className="text-xs text-zinc-400 truncate max-w-md">
                          {email.subject}
                        </span>
                        {email.sender?.email && (
                          <span className="text-[11px] text-zinc-500 truncate">
                            from {email.sender.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center pl-10 sm:pl-0">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{formatDateTime(email.sentAt)}</span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {email.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-5 mt-2 border-t border-surface-border/60">
                  <span className="text-xs text-zinc-500">
                    Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

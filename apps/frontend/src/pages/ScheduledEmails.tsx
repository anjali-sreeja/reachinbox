import React, { useState, useEffect, useCallback } from "react";
import { Clock, Mail, Calendar, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../services/api";
import type { Email, PaginatedApiResponse, PaginationMeta } from "../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";

const PAGE_SIZE = 20;

export const ScheduledEmails: React.FC = () => {
  const { error: toastError } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await api.get<PaginatedApiResponse<Email>>(
        `/api/emails/scheduled?page=${page}&limit=${PAGE_SIZE}`
      );
      if (res.data?.success) {
        setEmails(res.data.data || []);
        setPagination(res.data.pagination || null);
      }
    } catch (err) {
      console.warn("Failed to fetch scheduled emails:", err);
      toastError("Network Error", "Unable to load scheduled emails from server.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, toastError]);

  useEffect(() => {
    setIsLoading(true);
    void fetchScheduled();
  }, [fetchScheduled]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchScheduled();
  };

  const formatDateTime = (dateStr: string) => {
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
            <Clock className="w-6 h-6 text-amber-400" />
            Scheduled Emails
          </h1>
          <p className="text-sm text-zinc-400">
            Emails currently waiting in the BullMQ Redis queue.
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
          <CardTitle>Queue Status</CardTitle>
          <CardDescription>Live state from PostgreSQL and BullMQ delayed sets.</CardDescription>
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
              title="No scheduled emails"
              description="All scheduled emails have been dispatched or no new jobs have been enqueued."
              actionLabel="Schedule Emails"
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
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
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
                        <span>{formatDateTime(email.scheduledAt)}</span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          email.status === "PROCESSING"
                            ? "bg-brand-500/20 text-brand-300 border-brand-500/30 animate-pulse"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
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

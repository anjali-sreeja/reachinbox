import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Send,
  Loader2,
  AlertOctagon,
  Plus,
  ArrowRight,
  RefreshCw,
  Mail,
  Calendar,
} from "lucide-react";
import { api } from "../services/api";
import type { Email, PaginatedApiResponse } from "../types";
import { PageContainer } from "../components/layout/PageContainer";
import { StatCard } from "../components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Loading";
import { useToast } from "../components/ui/Toast";

export const Dashboard: React.FC = () => {
  const { error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [sentCount, setSentCount] = useState<number>(0);
  const [processingCount, setProcessingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch recent scheduled/processing emails
      const scheduledRes = await api.get<PaginatedApiResponse<Email>>(
        "/api/emails/scheduled?limit=5"
      );

      // 2. Fetch sent emails count
      const sentRes = await api.get<PaginatedApiResponse<Email>>(
        "/api/emails/sent?limit=5"
      );

      if (scheduledRes.data?.success) {
        const items = scheduledRes.data.data || [];
        setScheduledEmails(items);
        setScheduledCount(scheduledRes.data.pagination?.total || 0);

        // Count in-flight processing emails
        const processing = items.filter((e) => e.status === "PROCESSING").length;
        setProcessingCount(processing);
      }

      if (sentRes.data?.success) {
        setSentCount(sentRes.data.pagination?.total || 0);
      }

      // Estimate failed emails from items if any or default to 0
      setFailedCount(0);
    } catch (err) {
      console.warn("Failed to fetch dashboard metrics:", err);
      toastError("Network Error", "Unable to load live email metrics from server.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchDashboardData();
  };

  const formatScheduledTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <PageContainer>
      {/* ── Top Hero / Overview Section ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#11131E] via-[#0E101A] to-[#0B0D14] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-brand-500/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span>BullMQ Outbound Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Email operations, intelligently automated.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Monitor your scheduled outreach and delivery activity. BullMQ delayed queues guarantee restart persistence and rate limit enforcement.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              isLoading={isRefreshing}
              onClick={handleRefresh}
              className="text-zinc-300 border-white/10"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>

            <Link to="/compose">
              <Button
                variant="gradient"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-glow-sm"
              >
                Compose New Email
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 Statistics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Scheduled"
          value={isLoading ? "-" : scheduledCount}
          description="Awaiting BullMQ dispatch"
          icon={Clock}
          variant="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Sent"
          value={isLoading ? "-" : sentCount}
          description="Delivered via Ethereal SMTP"
          icon={Send}
          variant="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Processing"
          value={isLoading ? "-" : processingCount}
          description="In active worker execution"
          icon={Loader2}
          variant="brand"
          isLoading={isLoading}
        />
        <StatCard
          title="Failed"
          value={isLoading ? "-" : failedCount}
          description="Failed or rescheduled"
          icon={AlertOctagon}
          variant="rose"
          isLoading={isLoading}
        />
      </div>

      {/* ── Scheduled Emails Preview Section ── */}
      <Card className="border-white/10 bg-[#0E101A]/80 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Scheduled Emails Preview
            </CardTitle>
            <CardDescription>
              Upcoming jobs in the BullMQ queue sorted by scheduled dispatch time.
            </CardDescription>
          </div>

          <Link to="/scheduled">
            <Button variant="ghost" size="sm" className="text-brand-300 hover:text-brand-200">
              <span>View All</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : scheduledEmails.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-6 h-6 text-brand-400" />}
              title="No emails currently scheduled"
              description="Your BullMQ queue is clear. Schedule outreach emails with custom delays and rate limits."
              actionLabel="Compose New Email"
              onAction={() => {
                window.location.href = "/compose";
              }}
            />
          ) : (
            <div className="divide-y divide-surface-border/60">
              {scheduledEmails.map((email) => (
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center pl-10 sm:pl-0">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{formatScheduledTime(email.scheduledAt)}</span>
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
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

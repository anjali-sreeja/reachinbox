export type EmailStatus = "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";

export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export interface Sender {
  id: string;
  userId: string;
  email: string;
  smtpUser: string;
  createdAt: string;
}

export interface Email {
  id: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  jobId: string | null;
  attempts: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    email: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * Custom application error class.
 *
 * Throw this from any service/controller to produce a structured HTTP error
 * with a known status code and optional machine-readable error code.
 *
 * @example
 *   throw new AppError(404, "Email not found", "EMAIL_NOT_FOUND");
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string | undefined;
  /** Marks this error as "operational" (expected) vs programming bug */
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 Bad Request */
  static badRequest(message: string, code?: string) {
    return new AppError(400, message, code ?? "BAD_REQUEST");
  }

  /** 401 Unauthorized */
  static unauthorized(message = "Authentication required", code?: string) {
    return new AppError(401, message, code ?? "UNAUTHORIZED");
  }

  /** 403 Forbidden */
  static forbidden(message = "Access denied", code?: string) {
    return new AppError(403, message, code ?? "FORBIDDEN");
  }

  /** 404 Not Found */
  static notFound(resource = "Resource", code?: string) {
    return new AppError(404, `${resource} not found`, code ?? "NOT_FOUND");
  }

  /** 409 Conflict */
  static conflict(message: string, code?: string) {
    return new AppError(409, message, code ?? "CONFLICT");
  }

  /** 422 Unprocessable Entity */
  static unprocessable(message: string, code?: string) {
    return new AppError(422, message, code ?? "UNPROCESSABLE");
  }

  /** 429 Too Many Requests */
  static tooManyRequests(message = "Rate limit exceeded", code?: string) {
    return new AppError(429, message, code ?? "RATE_LIMITED");
  }

  /** 500 Internal Server Error */
  static internal(message = "An unexpected error occurred", code?: string) {
    return new AppError(500, message, code ?? "INTERNAL_ERROR", false);
  }
}

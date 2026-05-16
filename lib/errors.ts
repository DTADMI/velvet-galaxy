export enum ErrorType {
    NETWORK = "NETWORK",
    AUTH = "AUTH",
    PERMISSION = "PERMISSION",
    VALIDATION = "VALIDATION",
    RATE_LIMIT = "RATE_LIMIT",
    NOT_FOUND = "NOT_FOUND",
    SERVER = "SERVER",
    AI = "AI",
}

export interface AppError {
    type: ErrorType;
    code: string;
    message: string;
    detail?: string;
    retry?: boolean;
    statusCode?: number;
}

export function createAppError(
    type: ErrorType,
    code: string,
    message: string,
    detail?: string,
    retry = false,
    statusCode?: number
): AppError {
    return { type, code, message, detail, retry, statusCode };
}

export function isAppError(error: unknown): error is AppError {
    return (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        "code" in error &&
        "message" in error
    );
}

export function toAppError(error: unknown): AppError {
    if (isAppError(error)) return error;

    if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
            return createAppError(
                ErrorType.NETWORK,
                "NETWORK_ERROR",
                "Connection failed. Please check your internet and try again.",
                error.message,
                true
            );
        }
        return createAppError(
            ErrorType.SERVER,
            "UNKNOWN_ERROR",
            "Something went wrong. Please try again.",
            error.message,
            true
        );
    }

    return createAppError(
        ErrorType.SERVER,
        "UNKNOWN_ERROR",
        "An unexpected error occurred.",
        String(error),
        true
    );
}

export function getErrorMessage(error: unknown): string {
    const appError = toAppError(error);
    return appError.message;
}

export function getErrorDetail(error: unknown): string | undefined {
    const appError = toAppError(error);
    return appError.detail;
}

export function isRetryable(error: unknown): boolean {
    const appError = toAppError(error);
    return appError.retry ?? false;
}

export const ErrorMessages = {
    AUTH: {
        NOT_AUTHENTICATED: "Please sign in to continue.",
        SESSION_EXPIRED: "Your session has expired. Please sign in again.",
        INVALID_CREDENTIALS: "Invalid email or password.",
        EMAIL_NOT_VERIFIED: "Please verify your email address first.",
    },
    PERMISSION: {
        NOT_AUTHORIZED: "You don't have permission to perform this action.",
        NOT_ADMIN: "This action requires admin privileges.",
        NOT_ARTIST: "This feature requires an artist account.",
        POST_NOT_OWNER: "You can only edit your own posts.",
    },
    RATE_LIMIT: {
        POST_CREATE: "You're posting too quickly. Please wait a moment.",
        COMMENT: "You're commenting too quickly. Please slow down.",
        MESSAGE: "You're sending messages too quickly. Please wait.",
        LIKE: "You're going too fast. Please slow down.",
        FOLLOW: "Too many follow actions. Please wait.",
        LOGIN: "Too many login attempts. Please try again later.",
        SIGNUP: "Too many signup attempts. Please try again later.",
    },
    VALIDATION: {
        REQUIRED_FIELD: "This field is required.",
        INVALID_INPUT: "Please check your input and try again.",
        CONTENT_TOO_LONG: "Content exceeds the maximum length.",
        INVALID_FILE_TYPE: "This file type is not supported.",
        FILE_TOO_LARGE: "File size exceeds the maximum limit.",
    },
    NOT_FOUND: {
        POST: "This post could not be found.",
        USER: "This user could not be found.",
        GROUP: "This group could not be found.",
        EVENT: "This event could not be found.",
        PAGE: "The page you're looking for doesn't exist.",
    },
} as const;

export function formatRateLimitError(resetAt: number): string {
    const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000);
    if (waitSeconds <= 0) return "Please try again now.";
    if (waitSeconds < 60) return `Please wait ${waitSeconds} seconds.`;
    const minutes = Math.ceil(waitSeconds / 60);
    return `Please wait ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

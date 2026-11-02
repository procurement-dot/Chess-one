import { ClassErrorCode } from '../types/class.types';

export const CLASS_ERROR_MESSAGES: Record<ClassErrorCode | string, string> = {
  CLASS_NOT_FOUND: 'Class not found. Check the code.',
  ALREADY_MEMBER: 'You are already in this class.',
  CLASS_FULL: 'This class is full.',
  CLASS_ARCHIVED: 'This class is no longer active.',
  NOT_A_CLASS_MEMBER: 'You are not a member of this class.',
  NOT_CLASS_COACH: 'Only coaches can do this.',
  COACH_ROLE_REQUIRED: 'Only coaches can do this.',
  SESSION_NOT_LIVE: 'This class is not live right now.',
  SESSION_ALREADY_LIVE: 'Class is already live.',
  INVALID_FEN: 'This position is not valid.',
  INVALID_SOLUTION: 'Solution moves are not legal.',
  ASSIGNMENT_PAST_DUE: 'Due date has passed.',
  ALREADY_SUBMITTED: 'Already submitted.',
  VALIDATION_ERROR: 'Please check the highlighted fields.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
};

/**
 * Extract user-friendly error message from any error object or Axios response
 */
export function getErrorMessage(err: unknown): string {
  if (!err) {
    return 'Something went wrong. Please try again.';
  }

  // Handle Axios errors
  if (typeof err === 'object' && err !== null) {
    const anyErr = err as any;

    // Check structured response data: { success: false, error: { code, message, details } }
    const resData = anyErr.response?.data;
    const errorCode = resData?.error?.code || anyErr.errorCode;
    if (errorCode && CLASS_ERROR_MESSAGES[errorCode]) {
      return CLASS_ERROR_MESSAGES[errorCode];
    }

    if (resData?.error?.message) {
      return resData.error.message;
    }

    if (anyErr.userFriendlyMessage) {
      return anyErr.userFriendlyMessage;
    }

    // Network / offline error
    if (
      anyErr.code === 'ERR_NETWORK' ||
      anyErr.message === 'Network Error' ||
      (!anyErr.response && anyErr.request)
    ) {
      return 'Please check your internet connection.';
    }

    if (typeof anyErr.message === 'string' && anyErr.message.trim().length > 0) {
      return anyErr.message;
    }
  }

  if (typeof err === 'string') {
    return err;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Extract field-level validation errors from VALIDATION_ERROR details array
 */
export function getFieldErrors(err: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  if (typeof err !== 'object' || err === null) {
    return result;
  }

  const anyErr = err as any;
  const details =
    anyErr.response?.data?.error?.details ||
    anyErr.error?.details ||
    anyErr.details;

  if (Array.isArray(details)) {
    for (const item of details) {
      if (item && typeof item === 'object') {
        const fieldName = item.field || item.path?.[0] || item.key;
        const msg = item.message || 'Invalid value';
        if (fieldName) {
          result[String(fieldName)] = msg;
        }
      }
    }
  }

  return result;
}

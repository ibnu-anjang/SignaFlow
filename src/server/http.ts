import { NextResponse } from 'next/server';
import type { ApiError, ApiSuccess } from '@/types/contracts';

export function apiOk<T>(data: T, status = 200) {
  const body: ApiSuccess<T> = {
    ok: true,
    data,
    serverTimestampMs: Date.now(),
  };

  return NextResponse.json(body, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  const body: ApiError = {
    ok: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(body, { status });
}

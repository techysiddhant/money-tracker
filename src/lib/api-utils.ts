import { getAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function getAuthenticatedUser(request: NextRequest) {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return null;
  }

  return session.user;
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function getPaginationParams(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10))
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return apiResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}

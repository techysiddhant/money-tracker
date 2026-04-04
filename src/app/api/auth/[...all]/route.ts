import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const auth = getAuth();
    return toNextJsHandler(auth).POST!(request);
}

export async function GET(request: NextRequest) {
    const auth = getAuth();
    return toNextJsHandler(auth).GET!(request);
}
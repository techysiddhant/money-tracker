import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./schema";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getAuth() {
  const { env } = getCloudflareContext();
  
  return betterAuth({
    baseURL: (env as any).BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: (env as any).BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
  });
}

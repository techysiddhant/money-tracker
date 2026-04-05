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
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const isProd = process.env.NODE_ENV === "production" || (env as any).ENVIRONMENT === "production";
            if (isProd) {
              throw new Error("Signup is disabled in production");
            }
            return { data: user };
          },
        },
      },
    },
  });
}

import { z } from 'zod';

const envSchema = z.object({
  // LLM Providers
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_CHAT_MODEL: z.string().optional().default("gpt-4o"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // MySQL Data Lake
  MYSQL_HOST: z.string().min(1, "MYSQL_HOST is required"),
  MYSQL_PORT: z.string().transform(Number).default(3306),
  MYSQL_DATABASE: z.string().min(1, "MYSQL_DATABASE is required"),
  MYSQL_USER: z.string().min(1, "MYSQL_USER is required"),
  MYSQL_PASSWORD: z.string().min(1, "MYSQL_PASSWORD is required"),

  // App Config
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().transform(Number).default(4200),
});

export const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ Invalid environment variables:", env.error.flatten().fieldErrors);
  // In production, we might want to throw an error, but in dev, we can just warn
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables");
  }
}

export type Env = z.infer<typeof envSchema>;

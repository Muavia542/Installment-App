import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("Must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:\n", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;

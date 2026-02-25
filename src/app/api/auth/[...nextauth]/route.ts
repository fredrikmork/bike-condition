import { handlers } from "@/lib/auth/config";
export const { GET, POST } = handlers;

// Increase timeout for Vercel Pro; Hobby plan is capped at 10 s regardless.
export const maxDuration = 30;

export function loadEnv(): void;
export function supabaseUrl(): string;
export function publishableKey(): string;
export function secretKey(): string;
export function requireEnv(checks: [string, string][]): void;

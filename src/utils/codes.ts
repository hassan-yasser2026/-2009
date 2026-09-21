export function generateReferralCode(name: string): string {
  const base = name.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base || "USER"}${random}`;
}
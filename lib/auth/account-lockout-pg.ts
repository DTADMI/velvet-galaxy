import { createClient } from "@/lib/supabase/server";

export async function checkPgLockout(email: string): Promise<{
  locked: boolean; remainingAttempts: number;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_account_lockout", {
      p_email: email.toLowerCase().trim(),
    });
    if (error || !data) return { locked: false, remainingAttempts: 5 };
    return {
      locked: (data as { locked: boolean }).locked,
      remainingAttempts: (data as { remainingAttempts: number }).remainingAttempts,
    };
  } catch { return { locked: false, remainingAttempts: 5 }; }
}

export async function recordPgFailedAttempt(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("record_failed_attempt", { p_email: email.toLowerCase().trim() });
  } catch (err) { console.error("[account-lockout-pg] record error:", err); }
}

export async function resetPgLockout(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("reset_account_lockout", { p_email: email.toLowerCase().trim() });
  } catch (err) { console.error("[account-lockout-pg] reset error:", err); }
}

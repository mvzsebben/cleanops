"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    phone: "",
    timezone: DEFAULT_TIMEZONE,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    setSupabaseReady(true);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function bootstrapProfile(payload?: typeof form) {
    await fetch("/api/profile/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.fullName,
              company_name: form.companyName,
              phone: form.phone,
              timezone: form.timezone,
            },
          },
        });

        if (signUpError) throw signUpError;

        await bootstrapProfile(form);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (signInError) throw signInError;
        await bootstrapProfile();
      }

      startTransition(() => router.replace("/dashboard"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(0,122,255,0.16),_transparent_32%),linear-gradient(135deg,_#ffffff,_#f3f5f8)] p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_24px_64px_rgba(0,0,0,0.06)] lg:block">
            <p className="text-sm font-medium text-[#007AFF]">CleanOps</p>
            <h1 className="mt-4 max-w-lg text-5xl font-semibold tracking-tight text-[#111827]">
              Centralised booking visibility for cleaning teams.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#6b7280]">
              Track every client, property, booking, and sync in one Apple-clean dashboard built for operations, not hosts.
            </p>
          </div>

          <Card className="mx-auto w-full max-w-xl p-6 sm:p-8">
            <div className="mb-8 flex rounded-full bg-[#f2f3f5] p-1">
              {(["login", "signup"] as const).map((currentMode) => (
                <button
                  key={currentMode}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                    mode === currentMode ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]"
                  }`}
                  onClick={() => setMode(currentMode)}
                  type="button"
                >
                  {currentMode === "login" ? "Log in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-semibold tracking-tight">{mode === "login" ? "Welcome back" : "Set up your profile"}</h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                {mode === "login"
                  ? "Use your email and password to access the dashboard."
                  : "This creates your Supabase account, profile, and starter client/property data."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <>
                  <Input placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
                  <Input placeholder="Company name" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
                  <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                  <Input placeholder="Timezone" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
                </>
              ) : null}
              <Input placeholder="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <Input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              {error ? <p className="text-sm text-[#FF3B30]">{error}</p> : null}
              <Button className="w-full" disabled={loading || !supabaseReady} type="submit">
                {loading ? "Working..." : !supabaseReady ? "Preparing..." : mode === "login" ? "Log in" : "Create account"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}

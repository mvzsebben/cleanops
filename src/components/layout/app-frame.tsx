import Link from "next/link";
import { CalendarDays, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProfileRecord } from "@/types/app";

interface AppFrameProps {
  profile: ProfileRecord | null;
  activePath: "/dashboard" | "/settings/clients";
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: CalendarDays },
  { href: "/settings/clients", label: "Clients", icon: Settings },
];

export function AppFrame({ profile, activePath, children }: AppFrameProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-4 md:flex-row md:px-6">
        <Card className="w-full shrink-0 p-4 md:sticky md:top-6 md:w-[240px] md:self-start">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#9ca3af]">CleanOps</p>
            <h1 className="mt-2 text-2xl font-semibold">Phase 1</h1>
            <p className="mt-3 text-sm text-[#6b7280]">
              {profile?.company_name || "Operations dashboard"}
            </p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activePath;

              return (
                <Link
                  key={item.href}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                    active ? "bg-[#eef5ff] text-[#007AFF]" : "text-[#4b5563] hover:bg-[#f1f3f6]"
                  }`}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-xl bg-[#f7f8fa] p-3 text-sm text-[#6b7280]">
            <p className="font-medium text-[#111827]">{profile?.full_name || "Owner"}</p>
            <p>{profile?.email}</p>
          </div>
        </Card>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

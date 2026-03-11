import { AppFrame } from "@/components/layout/app-frame";
import { bootstrapOwnerData, getProfile, requireUser } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await bootstrapOwnerData(user);
  const profile = await getProfile(user.id);

  return (
    <AppFrame activePath="/dashboard" profile={profile}>
      {children}
    </AppFrame>
  );
}

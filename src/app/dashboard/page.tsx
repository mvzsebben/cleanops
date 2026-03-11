import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardData, requireUser } from "@/lib/data";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return <DashboardShell bookings={data.bookings} clients={data.clients} profile={data.profile} />;
}

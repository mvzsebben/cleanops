import { AppFrame } from "@/components/layout/app-frame";
import { ClientSettings } from "@/components/settings/client-settings";
import { bootstrapOwnerData, getClientsWithProperties, getProfile, getLatestSyncLogs, requireUser } from "@/lib/data";

export default async function ClientSettingsPage() {
  const user = await requireUser();
  await bootstrapOwnerData(user);

  const [profile, clients, latestLogs] = await Promise.all([
    getProfile(user.id),
    getClientsWithProperties(user.id),
    getLatestSyncLogs(user.id),
  ]);

  const clientsWithLogs = clients.map((client) => ({
    ...client,
    properties: client.properties.map((property) => ({
      ...property,
      latestSyncLog: latestLogs[property.id] ?? null,
    })),
  }));

  return (
    <AppFrame activePath="/settings/clients" profile={profile}>
      <ClientSettings initialClients={clientsWithLogs} profile={profile} />
    </AppFrame>
  );
}

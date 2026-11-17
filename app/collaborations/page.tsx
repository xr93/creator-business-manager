import { getCollaborations } from "@/app/calendar/actions";
import CollaborationManager from "@/components/collaborations/collaboration-manager";

export const dynamic = "force-dynamic";

export default async function CollaborationsPage() {
  const result = await getCollaborations();
  return <CollaborationManager initialCollaborations={result.data} initialError={result.error} />;
}

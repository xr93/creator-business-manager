import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers'
import Overview from "@/components/overview/overview";
import { getCollaborations } from "@/app/calendar/actions";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getCollaborations();
  return <Overview collaborations={result.data} error={result.error} />;
}

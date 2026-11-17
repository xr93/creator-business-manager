import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers'
import Overview from "@/components/overview/overview";
import { getCollaborations } from "@/app/calendar/actions";
import { getInvoices } from "@/app/invoices/actions";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [collaborationResult, invoiceResult] = await Promise.all([
    getCollaborations(),
    getInvoices(),
  ]);

  return (
    <Overview
      collaborations={collaborationResult.data}
      invoices={invoiceResult.data}
      errors={[collaborationResult.error, invoiceResult.error].filter((error): error is string => Boolean(error))}
    />
  );
}

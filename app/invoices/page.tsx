import { getCollaborations } from "@/app/calendar/actions";
import { getInvoices } from "./actions";
import InvoiceManager from "@/components/invoices/invoice-manager";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoiceResult, collaborationResult] = await Promise.all([
    getInvoices(),
    getCollaborations(),
  ]);

  return (
    <InvoiceManager
      initialInvoices={invoiceResult.data}
      collaborations={collaborationResult.data}
      initialError={invoiceResult.error}
    />
  );
}

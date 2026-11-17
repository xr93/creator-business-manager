import type { InvoiceInput } from "@/app/invoices/actions";
import { invoiceIssuer, serviceTerms } from "./invoice-config";

const money = new Intl.NumberFormat("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function InvoiceTemplate({ invoice }: { invoice: InvoiceInput }) {
  const subtotal = invoice.quantity * invoice.unitPrice;
  const discount = subtotal * invoice.discountRate / 100;
  const total = subtotal - discount;

  return (
    <article id="invoice-print" className="mx-auto min-h-[720px] w-full max-w-[760px] bg-white p-8 text-slate-800 sm:p-12">
      <header className="flex justify-end border-b-2 border-black pb-8">
        <div className="max-w-sm text-right text-sm leading-6 text-slate-600">
          <p className="text-lg font-bold text-slate-950">{invoiceIssuer.name}</p>
          <p>IC: {invoiceIssuer.ic}</p>
          <p>TIN: {invoiceIssuer.tin}</p>
          <p className="whitespace-pre-line">{invoiceIssuer.address}</p>
          <p>Tel: {invoiceIssuer.phone}</p>
        </div>
      </header>

      <section className="grid gap-8 py-8 sm:grid-cols-2">
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill to</p><p className="mt-2 text-lg font-bold text-slate-900">{invoice.clientName || "Client name"}</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-500">{invoice.clientAddress || "Client address"}</p></div>
        <dl className="text-sm sm:text-right"><dt className="text-slate-400">Invoice number</dt><dd className="font-bold text-slate-900">{invoice.invoiceNumber || "-"}</dd><dt className="mt-3 text-slate-400">Issue date</dt><dd className="font-semibold text-slate-800">{invoice.issueDate || "-"}</dd></dl>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[1fr_70px_110px_120px] bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white"><span>Service / Item</span><span className="text-right">Qty</span><span className="text-right">Rate</span><span className="text-right">Amount</span></div>
        <div className="grid grid-cols-[1fr_70px_110px_120px] px-4 py-5 text-sm"><span className="pr-4 font-medium">{invoice.itemDescription || "Service description"}</span><span className="text-right">{invoice.quantity}</span><span className="text-right">{money.format(invoice.unitPrice)}</span><span className="text-right font-semibold">{money.format(subtotal)}</span></div>
      </div>

      <div className="ml-auto mt-6 w-full max-w-xs space-y-3 text-sm">
        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{invoice.currency} {money.format(subtotal)}</span></div>
        <div className="flex justify-between text-slate-500"><span>Discount ({invoice.discountRate}%)</span><span>- {invoice.currency} {money.format(discount)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold text-slate-950"><span>Total</span><span>{invoice.currency} {money.format(total)}</span></div>
      </div>

      <section className="mt-10 rounded-xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Service terms and conditions</p><ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-5 text-slate-600">{serviceTerms.map((term) => <li key={term}>{term}</li>)}</ol></section>
      <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">Thank you for your business.</footer>
    </article>
  );
}

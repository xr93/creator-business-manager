"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type InvoiceStatus = "Paid" | "Unpaid";

export type Invoice = {
  id: number;
  collaborationId: string | null;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  issueDate: string;
  currency: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  status: InvoiceStatus;
  createdAt: string;
};

export type InvoiceInput = Omit<Invoice, "id" | "createdAt"> & { id?: number };

type InvoiceRow = {
  id: number;
  collaboration_id: string | null;
  invoice_number: string;
  client_name: string;
  client_address: string;
  issue_date: string;
  currency: string;
  item_description: string;
  quantity: number | string;
  unit_price: number | string;
  discount_rate: number | string;
  status: string;
  created_at: string;
};

type DatabaseError = { code?: string; message?: string };

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    collaborationId: row.collaboration_id,
    invoiceNumber: row.invoice_number,
    clientName: row.client_name,
    clientAddress: row.client_address,
    issueDate: row.issue_date,
    currency: row.currency,
    itemDescription: row.item_description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    discountRate: Number(row.discount_rate),
    status: row.status === "Paid" ? "Paid" : "Unpaid",
    createdAt: row.created_at,
  };
}

function invoiceError(error: unknown) {
  const databaseError = error as DatabaseError;
  const message = databaseError.message ?? "Unknown database error";
  if (databaseError.code === "23505" && message.includes("collaboration")) return "This collaboration already has an invoice. Edit the existing invoice instead.";
  if (databaseError.code === "23505") return "That invoice number already exists. Use a different invoice number.";
  if (databaseError.code === "42501" || message.toLowerCase().includes("row-level security")) {
    return "Supabase blocked the invoice operation. Check the invoices table RLS policies.";
  }
  if (databaseError.code === "42P01" || databaseError.code === "PGRST205") {
    return "Invoice storage is not set up yet. Run supabase/invoices.sql in the Supabase SQL Editor.";
  }
  return `Supabase could not complete the invoice operation: ${message}`;
}

async function authenticatedClient() {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be signed in to manage invoices.");
  return { supabase, user };
}

const invoiceColumns = "id, collaboration_id, invoice_number, client_name, client_address, issue_date, currency, item_description, quantity, unit_price, discount_rate, status, created_at";

export async function getInvoices(): Promise<{ data: Invoice[]; error: string | null }> {
  try {
    const { supabase, user } = await authenticatedClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(invoiceColumns)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data: (data as InvoiceRow[]).map(toInvoice), error: null };
  } catch (error) {
    console.error("Failed to load invoices", error);
    return { data: [], error: invoiceError(error) };
  }
}

export async function saveInvoice(input: InvoiceInput): Promise<{ data: Invoice | null; error: string | null }> {
  try {
    const invoiceNumber = input.invoiceNumber.trim();
    const clientName = input.clientName.trim();
    const itemDescription = input.itemDescription.trim();
    if (!input.collaborationId) {
      return { data: null, error: "Select a collaboration before creating an invoice." };
    }
    if (!invoiceNumber || !clientName || !itemDescription) {
      return { data: null, error: "Invoice number, client name, and description are required." };
    }
    if (input.quantity <= 0 || input.unitPrice < 0 || input.discountRate < 0 || input.discountRate > 100) {
      return { data: null, error: "Check the quantity, rate, and discount values." };
    }

    const { supabase, user } = await authenticatedClient();
    const { data: collaboration, error: collaborationError } = await supabase
      .from("collaborations")
      .select("id")
      .eq("id", input.collaborationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (collaborationError) throw collaborationError;
    if (!collaboration) return { data: null, error: "That collaboration was not found in your account." };

    const values = {
      collaboration_id: input.collaborationId || null,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_address: input.clientAddress.trim(),
      issue_date: input.issueDate,
      currency: input.currency.toUpperCase(),
      item_description: itemDescription,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      discount_rate: input.discountRate,
      status: input.status,
      updated_at: new Date().toISOString(),
      user_id: user.id,
    };

    const query = input.id
      ? supabase.from("invoices").update(values).eq("id", input.id).eq("user_id", user.id)
      : supabase.from("invoices").insert(values);
    const { data, error } = await query.select(invoiceColumns).single();
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/invoices");
    return { data: toInvoice(data as InvoiceRow), error: null };
  } catch (error) {
    console.error("Failed to save invoice", error);
    return { data: null, error: invoiceError(error) };
  }
}

export async function deleteInvoice(id: number): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await authenticatedClient();
    const { error } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/invoices");
    return { error: null };
  } catch (error) {
    console.error("Failed to delete invoice", error);
    return { error: invoiceError(error) };
  }
}

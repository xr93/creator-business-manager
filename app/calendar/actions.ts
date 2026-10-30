"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type Collaboration = {
  id: string;
  name: string;
  postingType: "Photo" | "Video";
  status: "Scheduled" | "Posted";
  visitDate: string;
  deadline: string;
  payment: number;
};

export type CollaborationInput = Omit<Collaboration, "id"> & { id?: string };

type CollaborationRow = {
  id: string;
  name: string;
  posting_type: string[];
  status: string;
  visit_date: string;
  deadline: string;
  payment: number | string;
};

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

function databaseErrorMessage(error: unknown) {
  const databaseError = error as DatabaseError;
  const message = databaseError.message ?? "Unknown database error";

  if (databaseError.code === "42501" || message.toLowerCase().includes("row-level security")) {
    return "Supabase blocked this save with Row Level Security. Add SELECT, INSERT, and UPDATE policies for rows where user_id = auth.uid().";
  }
  if (databaseError.code === "23514") {
    return `A database constraint rejected one of the selected values: ${message}`;
  }
  if (databaseError.code === "23502") {
    return `A required database field is missing: ${message}`;
  }
  if (databaseError.code === "PGRST204") {
    return `The collaborations table does not match the application fields: ${message}`;
  }
  if (error instanceof Error && !databaseError.code) return error.message;
  return `Supabase could not save the collaboration: ${message}`;
}

function toCollaboration(row: CollaborationRow): Collaboration {
  return {
    id: row.id,
    name: row.name,
    postingType: row.posting_type.includes("Video") ? "Video" : "Photo",
    status: row.status === "Posted" ? "Posted" : "Scheduled",
    visitDate: row.visit_date,
    deadline: row.deadline,
    payment: Number(row.payment),
  };
}

async function authenticatedClient() {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("You must be signed in to manage collaborations.");
  return { supabase, user };
}

export async function getCollaborations(): Promise<{
  data: Collaboration[];
  error: string | null;
}> {
  try {
    const { supabase, user } = await authenticatedClient();
    const { data, error } = await supabase
      .from("collaborations")
      .select("id, name, posting_type, status, visit_date, deadline, payment")
      .eq("user_id", user.id)
      .order("visit_date", { ascending: true });

    if (error) throw error;
    return { data: (data as CollaborationRow[]).map(toCollaboration), error: null };
  } catch (error) {
    console.error("Failed to load collaborations", error);
    return { data: [], error: "Could not load collaborations." };
  }
}

export async function saveCollaboration(input: CollaborationInput): Promise<{
  data: Collaboration | null;
  error: string | null;
}> {
  try {
    const name = input.name.trim();
    if (!name) return { data: null, error: "Enter a campaign or job name." };
    const visitTime = Date.parse(input.visitDate);
    const deadlineTime = Date.parse(input.deadline);
    if (!Number.isFinite(visitTime) || !Number.isFinite(deadlineTime)) {
      return { data: null, error: "Enter a valid visit time and content deadline." };
    }
    if (deadlineTime < visitTime) {
      return { data: null, error: "Content deadline cannot be before the visit time." };
    }
    if (!Number.isFinite(input.payment) || input.payment < 0) {
      return { data: null, error: "Payment must be zero or more." };
    }

    const { supabase, user } = await authenticatedClient();
    const values = {
      name,
      posting_type: [input.postingType],
      status: input.status,
      visit_date: new Date(visitTime).toISOString(),
      deadline: new Date(deadlineTime).toISOString(),
      payment: input.payment,
      user_id: user.id,
    };

    const query = input.id
      ? supabase.from("collaborations").update(values).eq("id", input.id).eq("user_id", user.id)
      : supabase.from("collaborations").insert(values);
    const { data, error } = await query
      .select("id, name, posting_type, status, visit_date, deadline, payment")
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/calendar");
    return { data: toCollaboration(data as CollaborationRow), error: null };
  } catch (error) {
    console.error("Failed to save collaboration", error);
    return { data: null, error: databaseErrorMessage(error) };
  }
}

export async function deleteCollaboration(id: string): Promise<{ error: string | null }> {
  try {
    const { supabase, user } = await authenticatedClient();
    const { error } = await supabase
      .from("collaborations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/calendar");
    return { error: null };
  } catch (error) {
    console.error("Failed to delete collaboration", error);
    return { error: databaseErrorMessage(error) };
  }
}

// supabase.js — Aught data layer (MVP 0.1)
// Dedicated, modular Supabase client + read/create helpers.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ---------- Credentials ----------
const SUPABASE_URL = "https://omrmesxoovjvwplabozo.supabase.co";
const SUPABASE_KEY = "sb_publishable_cOduDbZCbilXA4Mz33zkiQ_dCY9x6Y6";

// ---------- Client ----------
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Read ----------
// Fetch all rows from public.theses.
// Returns an array of rows (empty array on error so callers stay simple).
export async function getTheses() {
  const { data, error } = await supabase.from("theses").select("*");

  if (error) {
    console.error("[Aught] Failed to fetch theses:", error);
    return [];
  }

  return data;
}

// ---------- Create ----------
// Insert a single thesis row into public.theses.
// The object is inserted exactly as received — no renaming or transforming.
// Returns { data, error } so the caller can show success/error messaging.
export async function createThesis(thesis) {
  console.log("Sending thesis:", thesis);
  console.log("Keys:", Object.keys(thesis));

  const { data, error } = await supabase
    .from("theses")
    .insert([thesis])
    .select();

  if (error) {
    console.error("[Aught] Failed to create thesis:", error);
  }

  return { data, error };
}

// ---------- Update ----------
// Update the row in public.theses whose id matches with the given fields.
// Returns { data, error } so the caller can show success/error messaging.
export async function updateThesis(id, thesis) {
  const { data, error } = await supabase
    .from("theses")
    .update(thesis)
    .eq("id", id)
    .select();

  if (error) {
    console.error("[Aught] Failed to update thesis:", error);
  }

  return { data, error };
}

// ---------- Delete ----------
// Delete the row from public.theses whose id matches.
// Returns { data, error } so the caller can show success/error messaging.
export async function deleteThesis(id) {
  const { data, error } = await supabase
    .from("theses")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("[Aught] Failed to delete thesis:", error);
  }

  return { data, error };
}

// =================================================================
// Companies CRUD — same structure/error handling as the Theses CRUD.
// =================================================================

// ---------- Read ----------
// Fetch all rows from public.companies.
// Returns an array of rows (empty array on error so callers stay simple).
export async function getCompanies() {
  const { data, error } = await supabase.from("companies").select("*");

  if (error) {
    console.error("[Aught] Failed to fetch companies:", error);
    return [];
  }

  return data;
}

// ---------- Create ----------
// Insert a single company row into public.companies.
// The object is inserted exactly as received — no renaming or transforming.
// Returns { data, error } so the caller can show success/error messaging.
export async function createCompany(company) {
  const { data, error } = await supabase
    .from("companies")
    .insert([company])
    .select();

  if (error) {
    console.error("[Aught] Failed to create company:", error);
  }

  return { data, error };
}

// ---------- Update ----------
// Update the row in public.companies whose id matches with the given fields.
// Returns { data, error } so the caller can show success/error messaging.
export async function updateCompany(id, company) {
  const { data, error } = await supabase
    .from("companies")
    .update(company)
    .eq("id", id)
    .select();

  if (error) {
    console.error("[Aught] Failed to update company:", error);
  }

  return { data, error };
}

// ---------- Delete ----------
// Delete the row from public.companies whose id matches.
// Returns { data, error } so the caller can show success/error messaging.
export async function deleteCompany(id) {
  const { data, error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("[Aught] Failed to delete company:", error);
  }

  return { data, error };
}

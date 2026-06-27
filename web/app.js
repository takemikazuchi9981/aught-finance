// Aught — dashboard (Phase 2 render + Phase 3 thesis Create)
// Rendering uses local seed data; Create is delegated to the modular
// Supabase data layer in supabase.js. Loaded as an ES module.

import { createThesis, getTheses, deleteThesis, updateThesis } from "./supabase.js";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "./supabase.js";

const data = {
  // Loaded live from Supabase via loadCompanies(); see supabase.js.
  companies: [],

  events: [
    { title: "TSMC raises 2026 capex guidance", company: "TSM", when: "2026-06-26", impact: "pos" },
    { title: "Intel delays 18A volume ramp", company: "INTC", when: "2026-06-24", impact: "neg" },
    { title: "Nvidia announces Rubin platform", company: "NVDA", when: "2026-06-22", impact: "pos" },
    { title: "ASML books record EUV orders", company: "ASML", when: "2026-06-20", impact: "pos" },
    { title: "Cloud capex softens QoQ", company: "MSFT", when: "2026-06-18", impact: "neu" },
  ],

  // Loaded live from Supabase via loadTheses(); see supabase.js.
  theses: [],

  relationships: [
    { from: "Nvidia", type: "manufactured by", to: "TSMC" },
    { from: "TSMC", type: "buys tools from", to: "ASML" },
    { from: "Microsoft", type: "largest GPU buyer of", to: "Nvidia" },
    { from: "Intel", type: "competes with", to: "TSMC" },
  ],
};

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

const el = (tag, className, html) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
};

const stanceClass = { bull: "bull", bear: "bear", watch: "watch" };

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// ---------- renderers ----------
function renderStats() {
  const stats = [
    { label: "Companies", value: data.companies.length, delta: "tracked" },
    { label: "Events (7d)", value: data.events.length, delta: "+2 vs prior", cls: "up" },
    { label: "Active Theses", value: data.theses.length, delta: "live" },
    { label: "Relationships", value: data.relationships.length, delta: "mapped" },
  ];
  const wrap = $("stats");
  wrap.innerHTML = "";
  stats.forEach((s) => {
    const card = el("div", "stat-card");
    card.appendChild(el("div", "label", s.label));
    card.appendChild(el("div", "value", String(s.value)));
    card.appendChild(el("div", "delta " + (s.cls || ""), s.delta));
    wrap.appendChild(card);
  });
}

function renderCompanies(rows) {
  const body = $("companies");
  body.innerHTML = "";
  if (!rows.length) return body.appendChild(el("div", "empty", "No matches"));
  rows.forEach((c) => {
    const item = el("div", "item");
    const main = el("div", "item-main");
    main.appendChild(
      el(
        "div",
        "item-title",
        `${c.name}${c.ticker ? ` <span class="ticker">${c.ticker}</span>` : ""}`
      )
    );
    const sub = [c.sector, c.industry].filter(Boolean).join(" · ");
    main.appendChild(el("div", "item-sub", sub));
    item.appendChild(main);
    const editBtn = el("button", "btn-ghost", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => openCompanyEditModal(c));
    item.appendChild(editBtn);
    const delBtn = el("button", "btn-ghost", "Delete");
    delBtn.type = "button";
    delBtn.addEventListener("click", () => handleCompanyDelete(c.id));
    item.appendChild(delBtn);
    body.appendChild(item);
  });
  $("companies-count").textContent = rows.length;
}

function renderEvents(rows) {
  const body = $("events");
  body.innerHTML = "";
  if (!rows.length) return body.appendChild(el("div", "empty", "No matches"));
  rows.forEach((e) => {
    const item = el("div", "item");
    item.appendChild(el("div", "dot " + e.impact));
    const main = el("div", "item-main");
    main.appendChild(el("div", "item-title", e.title));
    main.appendChild(
      el("div", "item-sub", `${e.company} · ${fmtDate(e.when)}`)
    );
    item.appendChild(main);
    body.appendChild(item);
  });
  $("events-count").textContent = rows.length;
}

function renderTheses(rows) {
  const body = $("theses");
  body.innerHTML = "";
  if (!rows.length) return body.appendChild(el("div", "empty", "No matches"));
  rows.forEach((t) => {
    const conviction = Math.max(0, Math.min(5, Number(t.conviction) || 0));
    const item = el("div", "item");
    const main = el("div", "item-main");
    main.appendChild(el("div", "item-title", t.title));
    let sub = "Conviction " + "●".repeat(conviction) + "○".repeat(5 - conviction);
    if (t.horizon_date) sub += " · by " + fmtDate(t.horizon_date);
    main.appendChild(el("div", "item-sub", sub));
    item.appendChild(main);
    item.appendChild(
      el("span", "badge " + (stanceClass[t.stance] || "neutral"), t.stance || "new")
    );
    const editBtn = el("button", "btn-ghost", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => openEditModal(t));
    item.appendChild(editBtn);
    const delBtn = el("button", "btn-ghost", "Delete");
    delBtn.type = "button";
    delBtn.addEventListener("click", () => handleDelete(t.id));
    item.appendChild(delBtn);
    body.appendChild(item);
  });
  $("theses-count").textContent = rows.length;
}

function renderRelationships(rows) {
  const body = $("relationships");
  body.innerHTML = "";
  if (!rows.length) return body.appendChild(el("div", "empty", "No matches"));
  rows.forEach((r) => {
    const item = el("div", "item");
    const main = el("div", "item-main");
    main.appendChild(
      el("div", "item-title", `${r.from} → ${r.to}`)
    );
    main.appendChild(el("div", "item-sub", r.type));
    item.appendChild(main);
    body.appendChild(item);
  });
  $("relationships-count").textContent = rows.length;
}

// ---------- search ----------
function applySearch(q) {
  const t = q.trim().toLowerCase();
  const match = (str) => (str || "").toLowerCase().includes(t);

  renderCompanies(
    data.companies.filter(
      (c) =>
        !t ||
        match(c.name) ||
        match(c.ticker) ||
        match(c.sector) ||
        match(c.industry)
    )
  );
  renderEvents(
    data.events.filter((e) => !t || match(e.title) || match(e.company))
  );
  renderTheses(data.theses.filter((th) => !t || match(th.title) || match(th.claim)));
  renderRelationships(
    data.relationships.filter((r) => !t || match(r.from) || match(r.to) || match(r.type))
  );
}

// ---------- thesis modal + save ----------
let editingThesisId = null; // null = creating a new thesis; otherwise the id being edited

function openModal() {
  $("thesis-modal").classList.add("open");
  $("thesis-modal").setAttribute("aria-hidden", "false");
  $("f-title").focus();
}

function closeModal() {
  $("thesis-modal").classList.remove("open");
  $("thesis-modal").setAttribute("aria-hidden", "true");
  setMsg("", "");
}

function setMsg(text, kind) {
  const node = $("form-msg");
  node.textContent = text;
  node.className = "form-msg" + (kind ? " " + kind : "");
}

// Reset the form to its default empty state.
function resetForm() {
  $("thesis-form").reset();
  $("f-conviction").value = "3";
}

// Open the modal in Create mode (Step 8: New Thesis always creates).
function openCreateModal() {
  editingThesisId = null;
  resetForm();
  setMsg("", "");
  openModal();
}

// Open the modal in Edit mode, pre-filled with the thesis values (Steps 3 & 4).
function openEditModal(t) {
  editingThesisId = t.id;
  $("f-title").value = t.title || "";
  $("f-claim").value = t.claim || "";
  $("f-conviction").value = String(t.conviction || 3);
  // horizon_date is a DB date (YYYY-MM-DD); slice guards against a timestamp form.
  $("f-horizon").value = (t.horizon_date || "").slice(0, 10);
  setMsg("", "");
  openModal();
}

// Cancel: close, reset, and leave Create mode ready (Step 7).
function cancelModal() {
  editingThesisId = null;
  resetForm();
  closeModal();
}

function readForm() {
  return {
    title: $("f-title").value.trim(),
    claim: $("f-claim").value.trim(),
    conviction: Number($("f-conviction").value),
    horizon_date: $("f-horizon").value, // YYYY-MM-DD or ""
  };
}

function validate(t) {
  if (!t.title) return "Title is required.";
  if (!t.claim) return "Claim is required.";
  if (!(t.conviction >= 1 && t.conviction <= 5)) return "Conviction must be 1–5.";
  if (!t.horizon_date) return "Horizon end date is required.";
  return null;
}

async function handleSubmit(e) {
  e.preventDefault();
  const record = readForm();

  const error = validate(record);
  if (error) return setMsg(error, "error");

  const btn = $("save-thesis");
  btn.disabled = true;
  setMsg("Saving…", "info");

  const isEdit = editingThesisId !== null;
  const { error: dbError } = isEdit
    ? await updateThesis(editingThesisId, record)
    : await createThesis(record);

  if (dbError) {
    btn.disabled = false;
    return setMsg("Save failed: " + dbError.message, "error");
  }

  // Success: refresh the list from Supabase so the change appears immediately.
  await loadTheses();
  setMsg(isEdit ? "Thesis updated." : "Thesis saved.", "success");
  resetForm();
  editingThesisId = null;
  btn.disabled = false;

  // After an update, close the modal (Step 6). Create keeps the modal open as before.
  if (isEdit) setTimeout(closeModal, 800);
}

function setupThesisForm() {
  $("new-thesis-btn").addEventListener("click", openCreateModal);
  $("modal-close").addEventListener("click", cancelModal);
  $("modal-cancel").addEventListener("click", cancelModal);
  $("thesis-form").addEventListener("submit", handleSubmit);

  // Close on overlay click (but not when clicking inside the dialog).
  $("thesis-modal").addEventListener("click", (e) => {
    if (e.target === $("thesis-modal")) closeModal();
  });
  // Close on Escape.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("thesis-modal").classList.contains("open")) closeModal();
  });
}

// ---------- load theses (Supabase = source of truth) ----------
async function loadTheses() {
  try {
    const theses = await getTheses();
    data.theses = Array.isArray(theses) ? theses : [];
  } catch (err) {
    console.error("[Aught] Failed to load theses:", err);
    data.theses = [];
  }
  // Reuse the existing renderer; it also updates the count and empty state.
  renderTheses(data.theses);
}

// Delete a thesis (with confirmation), then refresh the list from Supabase.
async function handleDelete(id) {
  if (!confirm("Delete this thesis?")) return;

  const { error } = await deleteThesis(id);

  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  await loadTheses();
}

// ---------- company modal + save (mirrors the thesis section) ----------
let editingCompanyId = null; // null = creating a new company; otherwise the id being edited

function openCompanyModal() {
  $("company-modal").classList.add("open");
  $("company-modal").setAttribute("aria-hidden", "false");
  $("c-name").focus();
}

function closeCompanyModal() {
  $("company-modal").classList.remove("open");
  $("company-modal").setAttribute("aria-hidden", "true");
  setCompanyMsg("", "");
}

function setCompanyMsg(text, kind) {
  const node = $("company-form-msg");
  node.textContent = text;
  node.className = "form-msg" + (kind ? " " + kind : "");
}

function resetCompanyForm() {
  $("company-form").reset();
}

// Open the modal in Create mode (New Company always creates).
function openCompanyCreateModal() {
  editingCompanyId = null;
  resetCompanyForm();
  setCompanyMsg("", "");
  openCompanyModal();
}

// Open the modal in Edit mode, pre-filled with the company values.
function openCompanyEditModal(c) {
  editingCompanyId = c.id;
  $("c-name").value = c.name || "";
  $("c-ticker").value = c.ticker || "";
  $("c-exchange").value = c.exchange || "";
  $("c-country").value = c.country || "";
  $("c-sector").value = c.sector || "";
  $("c-industry").value = c.industry || "";
  $("c-website").value = c.website || "";
  $("c-description").value = c.description || "";
  setCompanyMsg("", "");
  openCompanyModal();
}

// Cancel: close, reset, and leave Create mode ready.
function cancelCompanyModal() {
  editingCompanyId = null;
  resetCompanyForm();
  closeCompanyModal();
}

function readCompanyForm() {
  return {
    name: $("c-name").value.trim(),
    ticker: $("c-ticker").value.trim(),
    exchange: $("c-exchange").value.trim(),
    country: $("c-country").value.trim(),
    sector: $("c-sector").value.trim(),
    industry: $("c-industry").value.trim(),
    website: $("c-website").value.trim(),
    description: $("c-description").value.trim(),
  };
}

function validateCompany(c) {
  if (!c.name) return "Name is required.";
  return null;
}

async function handleCompanySubmit(e) {
  e.preventDefault();
  const record = readCompanyForm();

  const error = validateCompany(record);
  if (error) return setCompanyMsg(error, "error");

  const btn = $("save-company");
  btn.disabled = true;
  setCompanyMsg("Saving…", "info");

  const isEdit = editingCompanyId !== null;
  const { error: dbError } = isEdit
    ? await updateCompany(editingCompanyId, record)
    : await createCompany(record);

  if (dbError) {
    btn.disabled = false;
    return setCompanyMsg("Save failed: " + dbError.message, "error");
  }

  // Success: refresh the list from Supabase so the change appears immediately.
  await loadCompanies();
  setCompanyMsg(isEdit ? "Company updated." : "Company saved.", "success");
  resetCompanyForm();
  editingCompanyId = null;
  btn.disabled = false;

  // After an update, close the modal. Create keeps the modal open as before.
  if (isEdit) setTimeout(closeCompanyModal, 800);
}

function setupCompanyForm() {
  $("new-company-btn").addEventListener("click", openCompanyCreateModal);
  $("company-modal-close").addEventListener("click", cancelCompanyModal);
  $("company-modal-cancel").addEventListener("click", cancelCompanyModal);
  $("company-form").addEventListener("submit", handleCompanySubmit);

  // Close on overlay click (but not when clicking inside the dialog).
  $("company-modal").addEventListener("click", (e) => {
    if (e.target === $("company-modal")) closeCompanyModal();
  });
  // Close on Escape.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("company-modal").classList.contains("open")) closeCompanyModal();
  });
}

// ---------- load companies (Supabase = source of truth) ----------
async function loadCompanies() {
  try {
    const companies = await getCompanies();
    data.companies = Array.isArray(companies) ? companies : [];
  } catch (err) {
    console.error("[Aught] Failed to load companies:", err);
    data.companies = [];
  }
  // Reuse the existing renderer; it also updates the count and empty state.
  renderCompanies(data.companies);
}

// Delete a company (with confirmation), then refresh the list from Supabase.
async function handleCompanyDelete(id) {
  if (!confirm("Delete this company?")) return;

  const { error } = await deleteCompany(id);

  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  await loadCompanies();
}

// ---------- init ----------
async function init() {
  applySearch("");
  setupThesisForm();
  setupCompanyForm();
  $("search").addEventListener("input", (e) => applySearch(e.target.value));
  await loadTheses();
  await loadCompanies();
  renderStats();
  $("last-updated").textContent =
    "Updated " + new Date().toLocaleString();
}

document.addEventListener("DOMContentLoaded", init);

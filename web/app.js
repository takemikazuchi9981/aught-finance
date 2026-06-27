// Aught — Phase 2 dashboard
// Self-contained: seed data + rendering. No build step, no dependencies.

const data = {
  companies: [
    { name: "Nvidia", ticker: "NVDA", sector: "Semiconductors", signal: "pos" },
    { name: "ASML", ticker: "ASML", sector: "Semi Equipment", signal: "pos" },
    { name: "TSMC", ticker: "TSM", sector: "Foundry", signal: "neu" },
    { name: "Intel", ticker: "INTC", sector: "Semiconductors", signal: "neg" },
    { name: "Microsoft", ticker: "MSFT", sector: "Software / Cloud", signal: "pos" },
  ],

  events: [
    { title: "TSMC raises 2026 capex guidance", company: "TSM", when: "2026-06-26", impact: "pos" },
    { title: "Intel delays 18A volume ramp", company: "INTC", when: "2026-06-24", impact: "neg" },
    { title: "Nvidia announces Rubin platform", company: "NVDA", when: "2026-06-22", impact: "pos" },
    { title: "ASML books record EUV orders", company: "ASML", when: "2026-06-20", impact: "pos" },
    { title: "Cloud capex softens QoQ", company: "MSFT", when: "2026-06-18", impact: "neu" },
  ],

  theses: [
    { title: "AI accelerator demand outruns supply", stance: "bull", conviction: 4 },
    { title: "Foundry leadership consolidates around TSMC", stance: "bull", conviction: 3 },
    { title: "Intel turnaround remains unproven", stance: "bear", conviction: 3 },
    { title: "EUV is the chokepoint of the chain", stance: "watch", conviction: 2 },
  ],

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
    item.appendChild(el("div", "dot " + c.signal));
    const main = el("div", "item-main");
    main.appendChild(
      el("div", "item-title", `${c.name} <span class="ticker">${c.ticker}</span>`)
    );
    main.appendChild(el("div", "item-sub", c.sector));
    item.appendChild(main);
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
    const item = el("div", "item");
    const main = el("div", "item-main");
    main.appendChild(el("div", "item-title", t.title));
    main.appendChild(
      el("div", "item-sub", "Conviction " + "●".repeat(t.conviction) + "○".repeat(5 - t.conviction))
    );
    item.appendChild(main);
    item.appendChild(
      el("span", "badge " + (stanceClass[t.stance] || "neutral"), t.stance)
    );
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
  const match = (str) => str.toLowerCase().includes(t);

  renderCompanies(
    data.companies.filter((c) => !t || match(c.name) || match(c.ticker) || match(c.sector))
  );
  renderEvents(
    data.events.filter((e) => !t || match(e.title) || match(e.company))
  );
  renderTheses(data.theses.filter((th) => !t || match(th.title) || match(th.stance)));
  renderRelationships(
    data.relationships.filter((r) => !t || match(r.from) || match(r.to) || match(r.type))
  );
}

// ---------- init ----------
function init() {
  renderStats();
  applySearch("");
  $("search").addEventListener("input", (e) => applySearch(e.target.value));
  $("last-updated").textContent =
    "Updated " + new Date().toLocaleString();
}

document.addEventListener("DOMContentLoaded", init);

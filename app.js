/* ═══════════════════════════════════════════
   KunieBLOX — Application Logic
   Vanilla JS · Hash Router · WEAO API
   ═══════════════════════════════════════════ */

const API_PROXY = "/api/executors";
const API_DIRECT = "https://weao.xyz/api/status/exploits";

let allExecutors = [];
let activeFilter = "all";
let searchQuery = "";

// ── Icons (minimal inline SVGs) ──
const ico = {
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963a.074.074 0 00-.041-.104 13.201 13.201 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};

// ── Helpers ──
function esc(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function statusKey(status) {
  const s = (status || "").toLowerCase();
  if (s === "updated") return "updated";
  if (s === "patched") return "patched";
  if (s === "outdated") return "outdated";
  return "unknown";
}

function priceText(ex) {
  if (ex.free) return { text: "Free", cls: "free" };
  return { text: ex.cost || "Paid", cls: "" };
}

// ── API ──
async function fetchData() {
  try {
    let res = await fetch(API_PROXY);
    if (!res.ok) throw 0;
    return parse(await res.json());
  } catch {
    try {
      let res = await fetch(API_DIRECT);
      if (!res.ok) throw 0;
      return parse(await res.json());
    } catch {
      return mockData();
    }
  }
}

function parse(raw) {
  const items = Array.isArray(raw) ? raw : raw?.data || [];
  if (!items.length) return mockData();

  return items.map(i => {
    let status = "Unknown";
    if (i.updateStatus && !i.detected) status = "Updated";
    else if (i.updateStatus && i.detected) status = "Patched";
    else if (!i.updateStatus) status = "Outdated";

    return {
      id: i._id || i.title,
      title: i.title,
      version: i.version,
      updated: i.updatedDate || "N/A",
      status,
      type: i.extype || "Unknown",
      system: i.platform || "Unknown",
      website: i.websitelink,
      discord: i.discordlink,
      uncPercentage: i.uncPercentage,
      suncPercentage: i.suncPercentage,
      decompiler: i.decompiler,
      clientmods: i.clientmods,
      free: i.free,
      cost: i.cost,
      raknet: i.raknet,
      multiInject: i.multiInject,
      description: i.slug?.fullDescription,
      logo: i.slug?.logo,
      owner: i.slug?.owner,
      screenshots: i.slug?.screenshots || [],
    };
  });
}

function mockData() {
  return [
    { id: "mock-1", title: "Solara", version: "1.0.5", updated: "06/18/2026", status: "Updated", type: "wexecutor", system: "Windows", free: true },
    { id: "mock-2", title: "Wave", version: "2.1.0", updated: "06/15/2026", status: "Patched", type: "wexecutor", system: "Windows", free: false, cost: "$10 Lifetime" },
  ];
}


/* ═══════════════════════════════
   DASHBOARD RENDERING
   ═══════════════════════════════ */

function renderStats() {
  const t = allExecutors.length;
  const u = allExecutors.filter(e => e.status === "Updated").length;
  const p = allExecutors.filter(e => e.status === "Patched").length;
  const o = allExecutors.filter(e => e.status === "Outdated").length;

  document.getElementById("stats-bar").innerHTML = `
    <div class="stat"><span class="stat-num c-total">${t}</span><span class="stat-label">Total</span></div>
    <div class="stat"><span class="stat-num c-updated">${u}</span><span class="stat-label">Updated</span></div>
    <div class="stat"><span class="stat-num c-patched">${p}</span><span class="stat-label">Patched</span></div>
    <div class="stat"><span class="stat-num c-outdated">${o}</span><span class="stat-label">Outdated</span></div>
  `;
}

function renderFilters() {
  const filters = ["all", "updated", "patched", "outdated"];
  const bar = document.getElementById("filter-bar");
  bar.innerHTML = filters.map(f =>
    `<button class="pill${activeFilter === f ? " active" : ""}" data-f="${f}">${f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}</button>`
  ).join("");

  bar.querySelectorAll(".pill").forEach(b => {
    b.addEventListener("click", () => { activeFilter = b.dataset.f; renderFilters(); renderGrid(); });
  });
}

function filtered() {
  return allExecutors.filter(e => {
    const fm = activeFilter === "all" || e.status.toLowerCase() === activeFilter;
    const sm = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    return fm && sm;
  });
}

function renderGrid() {
  const list = filtered();
  const grid = document.getElementById("executor-grid");
  const empty = document.getElementById("empty-state");

  if (!list.length) { grid.classList.add("hidden"); empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden"); grid.classList.remove("hidden");

  const sk = (s) => statusKey(s);
  grid.innerHTML = list.map(ex => {
    const p = priceText(ex);
    return `
    <article class="card" data-id="${esc(ex.id)}">
      <div class="card-top">
        <div>
          <div class="card-name">${esc(ex.title)}</div>
          <div class="card-status s-${sk(ex.status)}">
            <span class="dot d-${sk(ex.status)}"></span>
            ${esc(ex.status)}
          </div>
        </div>
        <span class="card-price ${p.cls}">${esc(p.text)}</span>
      </div>
      <div class="card-meta">
        <div class="card-field">
          <span class="field-label">Version</span>
          <span class="field-value">${esc(ex.version || "—")}</span>
        </div>
        <div class="card-field">
          <span class="field-label">Platform</span>
          <span class="field-value">${esc(ex.system || "—")}</span>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".card").forEach(c => {
    c.addEventListener("click", () => { window.location.hash = "#/executor/" + c.dataset.id; });
  });
}


/* ═══════════════════════════════
   DETAIL PAGE RENDERING
   ═══════════════════════════════ */

function renderDetail(ex) {
  if (!ex) {
    document.getElementById("detail-sidebar").innerHTML = '<div class="profile-card"><p>Not found.</p></div>';
    document.getElementById("detail-content").innerHTML = "";
    return;
  }

  const sk = statusKey(ex.status);
  const p = priceText(ex);

  // Sidebar
  document.getElementById("detail-sidebar").innerHTML = `
    <div class="profile-card">
      <div class="profile-logo-wrap">
        ${ex.logo ? `<img src="${esc(ex.logo)}" alt="${esc(ex.title)}" />` : `<span class="profile-letter">${esc(ex.title[0])}</span>`}
      </div>
      <h1 class="profile-name">${esc(ex.title)}</h1>
      <div class="profile-status s-${sk}"><span class="dot d-${sk}"></span>${esc(ex.status)}</div>
      <div class="profile-price-text ${p.cls}">${esc(p.text)}</div>
      <div class="profile-meta">
        <div class="card-field"><span class="field-label">Version</span><span class="field-value">${esc(ex.version || "—")}</span></div>
        <div class="card-field"><span class="field-label">Platform</span><span class="field-value">${esc(ex.system || "—")}</span></div>
        <div class="card-field"><span class="field-label">Type</span><span class="field-value">${esc(ex.type || "—")}</span></div>
        <div class="card-field"><span class="field-label">Updated</span><span class="field-value">${esc(ex.updated || "—")}</span></div>
      </div>
    </div>
    <div class="actions">
      ${ex.website ? `<a href="${esc(ex.website)}" target="_blank" rel="noopener" class="btn btn-accent">${ico.globe} Website</a>` : `<span class="btn btn-disabled">${ico.globe} No Website</span>`}
      ${ex.discord ? `<a href="${esc(ex.discord)}" target="_blank" rel="noopener" class="btn btn-discord">${ico.discord} Discord</a>` : ""}
    </div>
  `;

  // Content
  let html = "";

  // Gallery
  if (ex.screenshots?.length) {
    html += `<section class="section"><h2 class="section-title">Screenshots</h2><div class="gallery">${ex.screenshots.map(s => `<img src="${esc(s)}" alt="Screenshot" loading="lazy" />`).join("")}</div></section>`;
  }

  // Description
  if (ex.description) {
    const processed = ex.description.replace(/^! (.+)$/gm, "> $1");
    const rendered = marked.parse(processed);
    html += `
      <section class="section">
        <h2 class="section-title">About</h2>
        <div class="prose">${rendered}</div>
        ${ex.owner ? `<div class="owner-row"><div class="owner-avatar">${esc(ex.owner[0])}</div><div><div class="owner-label">Developer</div><div class="owner-name">${esc(ex.owner)}</div></div></div>` : ""}
      </section>`;
  }

  // Metrics + Features bento
  const hasMetrics = typeof ex.uncPercentage === "number" || typeof ex.suncPercentage === "number";
  const feats = [
    { l: "Decompiler", v: ex.decompiler },
    { l: "Client Mods", v: ex.clientmods },
    { l: "Multi-Inject", v: ex.multiInject },
    { l: "RakNet", v: ex.raknet },
  ].filter(f => f.v !== undefined);

  if (hasMetrics || feats.length) {
    html += '<div class="bento">';

    if (hasMetrics) {
      html += `<section class="section"><h2 class="section-title">Coverage</h2>`;
      if (typeof ex.uncPercentage === "number") html += metricHTML("UNC", "Universal Naming Convention", ex.uncPercentage);
      if (typeof ex.suncPercentage === "number") html += metricHTML("sUNC", "Script UNC", ex.suncPercentage);
      html += `</section>`;
    }

    if (feats.length) {
      html += `<section class="section"><h2 class="section-title">Capabilities</h2>${feats.map(f => featureHTML(f.l, f.v)).join("")}</section>`;
    }

    html += '</div>';
  }

  document.getElementById("detail-content").innerHTML = html;

  // Animate bars
  requestAnimationFrame(() => {
    document.querySelectorAll(".bar-fill").forEach(b => { b.style.width = b.dataset.pct + "%"; });
  });
}

function metricHTML(name, sub, pct) {
  return `
    <div class="metric">
      <div class="metric-head">
        <span class="metric-name">${name}</span>
        <span class="metric-pct">${pct}%</span>
      </div>
      <div class="metric-sub">${sub}</div>
      <div class="bar-track"><div class="bar-fill" data-pct="${pct}"></div></div>
    </div>`;
}

function featureHTML(label, active) {
  const icon = active
    ? `<span class="feature-icon yes">${ico.check}</span>`
    : `<span class="feature-icon no">${ico.x}</span>`;
  return `<div class="feature"><span class="feature-label">${esc(label)}</span>${icon}</div>`;
}


/* ═══════════════════════════════
   ROUTER
   ═══════════════════════════════ */

function route() {
  const h = window.location.hash || "#/";
  if (h.startsWith("#/executor/")) {
    const id = decodeURIComponent(h.replace("#/executor/", ""));
    const ex = allExecutors.find(e => e.id === id);
    document.getElementById("dashboard-view").classList.add("hidden");
    document.getElementById("detail-view").classList.remove("hidden");
    renderDetail(ex);
    window.scrollTo(0, 0);
  } else {
    document.getElementById("detail-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
  }
}


/* ═══════════════════════════════
   INIT
   ═══════════════════════════════ */

async function init() {
  document.getElementById("search-input").addEventListener("input", e => {
    searchQuery = e.target.value;
    renderGrid();
  });

  document.getElementById("btn-clear-filters").addEventListener("click", () => {
    activeFilter = "all";
    searchQuery = "";
    document.getElementById("search-input").value = "";
    renderFilters();
    renderGrid();
  });

  document.getElementById("btn-back").addEventListener("click", () => {
    window.location.hash = "#/";
  });

  window.addEventListener("hashchange", route);

  allExecutors = await fetchData();
  document.getElementById("loading-state").classList.add("hidden");

  renderStats();
  renderFilters();
  renderGrid();
  route();
}

init();

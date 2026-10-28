/* EFI early preview: vanilla JS single-page app. Data is baked at build time (data/data.js); the only network
   call is POST /api/feedback when a visitor chooses to send feedback or a workshop request. */
(function(){
"use strict";
const D = window.EFI_DATA, S = window.EFI_SIGNALS, TILES = window.EFI_TILES, FOOT = window.EFI_FOOT, SITE = window.EFI_SITE || {};
const $ = (s, el=document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const NET = Object.fromEntries(D.networks.map(n => [n.id, n]));
const lab = id => id ? ((NET[id] || {}).label || id) : "";
const W = D.weather, M = W.metrics || {}, P = D.projects, PS = P.signals;
const fmt = (v, d=1) => v == null || isNaN(v) ? "—" : Number(v).toLocaleString("en-GB", {minimumFractionDigits:d, maximumFractionDigits:d});
const int = v => v == null ? "—" : Number(v).toLocaleString("en-GB", {maximumFractionDigits:0});
const pct = (a, b) => b ? fmt(a / b * 100, 0) + "%" : "—";
const gw = mw => mw >= 1000 ? fmt(mw / 1000, mw >= 10000 ? 0 : 1) + " GW" : int(mw) + " MW";
const isDNO = id => D.dnos.includes(id);
const role = id => (NET[id] || {}).role;
const SIG = Object.fromEntries(S.map(s => [s.id, s]));
const SLUG = Object.fromEntries(S.map(s => [s.slug, s])), BYID = Object.fromEntries(S.map(s => [s.id, s]));
const nm = id => id === "gb" ? "Great Britain" : lab(id);

/* evidence labels: every figure on the site is one of these */
const LBL = {od:'<span class="lbl od">Open data</span>', dr:'<span class="lbl dr">Draft EFI assessment</span>', il:'<span class="lbl il">Illustrative</span>', gp:'<span class="lbl gp">Data gap</span>'};

/* ---------- icons: original line glyphs, 24 grid ---------- */
const G = {
 storm:'<path d="M7 16h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.6A3.2 3.2 0 0 0 7 16z"/><path d="M12.5 13l-2 4h3l-2 4"/>',
 drone:'<circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/><rect x="10" y="10" width="4" height="4"/>',
 robot:'<rect x="5" y="8" width="14" height="10"/><path d="M12 8V4M10 4h4M9 13h.01M15 13h.01M8 21v-3M16 21v-3"/>',
 crew:'<path d="M4 15h16M6 15a6 6 0 0 1 12 0M12 9V6"/><path d="M8 19h8"/>',
 dc:'<rect x="5" y="3" width="14" height="5"/><rect x="5" y="10" width="14" height="5"/><rect x="5" y="17" width="14" height="4"/><path d="M8 5.5h.01M8 12.5h.01M8 19h.01"/>',
 queue:'<path d="M4 6h10M4 12h14M4 18h7"/><path d="M18 4l2 2-2 2"/>',
 sat:'<rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)"/><path d="M4 4l4 4M20 20l-4-4M3 8l5-5M16 21l5-5M15 3a6 6 0 0 1 6 6"/>',
 sst:'<rect x="4" y="5" width="16" height="14"/><path d="M8 12h2l1-3 2 6 1-3h2"/>',
 doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
 check:'<path d="M5 12l4 4 10-10"/>'
};
const ic = (k, sz=22) => `<svg class="ic" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true" focusable="false">${G[k]}</svg>`;

/* ---------- state ---------- */
const store = { get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e) {} } };
const st = {
  net: store.get("efi.net") || "gb", metric: "gust20",
  model: {drone:60, crews:30, size:1},
  asm: {find:0.45, dispatch:0.20, repair:0.35, dFind:0.60, cDispatch:0.30, cRepair:0.20},
  wi: {dcflex:{mw:100, hours:100, wait:6}, queue:{apps:600, nonviable:40, acc:80}},
  wk: {step:1, net:null, signal:"storm", route:null, notes:""},
  fb: {}
};
const qn = new URLSearchParams(location.search).get("net"); if (qn && NET[qn]) st.net = qn;
if (!NET[st.net]) st.net = "gb";

/* ---------- data helpers ---------- */
const MET = {gust20:{l:"Days with gusts ≥ 20 m/s", s:"Gusts ≥20 m/s"}, gust25:{l:"Days with gusts ≥ 25 m/s", s:"Gusts ≥25 m/s"},
             rain20:{l:"Heavy-rain days (≥ 20 mm)", s:"Rain ≥20 mm"}, hot30:{l:"Hot days (max ≥ 30 °C)", s:"Hot ≥30 °C"}};
const wv = (met, id) => (M[met] || {})[id];
const rankAmong = (fn, id) => { const v = D.dnos.map(n => [n, fn(n)]).filter(x => x[1] != null).sort((a,b) => b[1]-a[1]); const i = v.findIndex(x => x[0] === id); return i < 0 ? null : {rank:i+1, of:v.length}; };
const floodShare = id => { const f = D.flood[id]; return f && f.located && f.flagged != null ? f.flagged / f.sites : null; };
const hrShare = id => { const h = D.headroom[id]; return h && h.sites ? h.lt5 / h.sites : null; };
const aigz = id => (D.datacentres.aigz || []).filter(z => id === "gb" || z.network === id);
const ord = n => n + (["th","st","nd","rd"][(n%100-20)%10] || ["th","st","nd","rd"][n%100] || "th");
const wxNet = id => (isDNO(id) || id === "gb") ? id : (id === "neso" ? "gb" : null);
const projOf = (sig, id) => (PS[sig].items || []).filter(p => id === "gb" || p.owner_network_id === id);
const projLine = sig => `${int(PS[sig].n)} of ${int(P.total_innovation)} network-innovation projects`;

/* ---------- draft ranking rule: the same rule for every network, every point itemised ---------- */
function ranked(id){
  const r = role(id);
  return S.map((s, order) => {
    const parts = [{pts: s.rel * 10 + s.ev * 2, t: `Draft EFI scores: relevance ${s.rel}/3 × 10 + evidence ${s.ev}/3 × 2`}];
    const ps = PS[s.id];
    if (ps.sub_n === 0) parts.push({pts:3, t:`First-mover gap: no GB network-innovation project found on ${ps.sub_label} (keyword check)`});
    const tier = rk => rk ? (rk.rank <= 2 ? 6 : rk.rank <= 4 ? 3 : 0) : 0;
    if (s.id === "storm") {
      const rk = isDNO(id) ? rankAmong(n => wv("gust20", n), id) : null;
      if (rk) parts.push({pts:tier(rk), t:`Exposure: ${ord(rk.rank)} most storm gust-days of ${rk.of} DNO areas (${W.short})`});
      else if (id !== "gb") parts.push({pts:0, t:"Exposure: no storm figure split out for this network yet, no adjustment"});
    }
    if (s.id === "flood") {
      const rk = isDNO(id) ? rankAmong(floodShare, id) : null;
      if (rk) parts.push({pts:tier(rk), t:`Exposure: ${ord(rk.rank)} highest share of sites in mapped flood areas of ${rk.of} DNOs`});
    }
    if (s.id === "queue" && (r === "TO" || r === "SO")) parts.push({pts:6, t:"Role: the transmission queue (TEC register, connections reform) sits with TOs and NESO"});
    if (s.id === "dcflex") {
      if (r === "TO" || r === "SO") parts.push({pts:2, t:"Role: the largest data-centre requests connect at transmission level"});
      if (isDNO(id)) { const z = aigz(id).length; parts.push({pts: z ? 3 : 0, t:`Exposure: ${z} AI Growth Zone${z === 1 ? "" : "s"} announced in this area (DSIT)`}); }
    }
    if (s.id === "sst" && isDNO(id)) {
      const h = hrShare(id); if (h != null) parts.push({pts: h >= 1/3 ? 3 : 0, t:`Exposure: ${fmt(h*100,0)}% of listed sites under 5 MW demand headroom (+3 at one third or more; DNO methods differ)`});
    }
    const score = parts.reduce((a, p) => a + p.pts, 0);
    return {...s, score, parts, order};
  }).sort((a,b) => b.score - a.score || b.rel - a.rel || b.ev - a.ev || a.order - b.order);
}
const whyList = (s, total=true) => `<ul>${s.parts.map(p => `<li>${p.pts ? (p.pts > 0 ? "+" : "") + p.pts : "+0"} · ${esc(p.t)}</li>`).join("")}</ul>${total ? `<div class="tot">Draft score ${s.score}</div>` : ""}`;

/* ---------- shared UI bits ---------- */
const bars = (n, max=3) => `<span class="db" aria-hidden="true">${Array.from({length:max}, (_, k) => `<i class="${k < n ? "on" : ""}"></i>`).join("")}</span>`;
const tag = (k, n, l) => `<span class="tg">${k} ${bars(n)} <em>${l}</em><span class="sr"> (${n} of 3)</span></span>`;
const hz = h => `<div class="hz" role="img" aria-label="Horizon: ${h} term"><div class="hzt"><i style="left:${h === "Near" ? 18 : 82}%"></i></div><div class="hzl" aria-hidden="true"><span>Near</span><span>Horizon</span><span>Far</span></div></div>`;
const src = t => `<div class="src">${t}</div>`;
const a = (href, text, cls="") => `<a href="${href}"${cls ? ` class="${cls}"` : ""}>${text}</a>`;
const ext = (href, text) => href ? `<a href="${esc(href)}" rel="noopener noreferrer" target="_blank">${text}<span class="sr"> (opens in a new tab)</span></a>` : text;
const sigHref = s => "/signals/" + s.slug;

/* ---------- schematic map ---------- */
function inFoot(id, t){ if (id === "gb" || FOOT[id] === "*") return true;
  if (isDNO(id)) return t[3] === id;
  return (FOOT[id] || []).some(f => { const [n, l] = f.split(":"); return n === t[3] && (!l || l === t[2]); }); }
function mix(a, b, t){ const p = h => [1,3,5].map(i => parseInt(h.substr(i,2),16)); const A = p(a), B = p(b);
  return "#" + A.map((v,i) => Math.round(v + (B[i]-v)*t).toString(16).padStart(2,"0")).join(""); }
function lines(l){ const w = l.split(" "), out = [""]; w.forEach(x => { if ((out[out.length-1] + " " + x).trim().length > 13) out.push(x); else out[out.length-1] = (out[out.length-1] + " " + x).trim(); }); return out.filter(Boolean).slice(0, 3); }
function map(id, met){
  const cell = 84, gap = 6, vals = D.dnos.map(n => wv(met, n)).filter(v => v != null), mx = Math.max(...vals, 0), mn = Math.min(...vals, 0);
  let s = `<svg viewBox="0 0 ${4*(cell+gap)} ${7*(cell+gap)}" class="map" role="img" aria-label="Schematic map of licence areas shaded by ${MET[met].l}. Values: ${D.dnos.map(n => lab(n) + " " + fmt(wv(met, n))).join(", ")}">`;
  TILES.forEach(t => { const [c, r, l, n] = t, x = c*(cell+gap), y = r*(cell+gap), v = wv(met, n);
    const k = mx > mn && v != null ? (v - mn) / (mx - mn) : 0, on = inFoot(id, t), dark = k > .5;
    s += `<g class="tile ${on ? "on" : "off"}"><rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${mix("#eeece6", "#2b2b30", k)}"/>
      ${on && id !== "gb" ? `<rect x="${x+1.5}" y="${y+1.5}" width="${cell-3}" height="${cell-3}" rx="2" fill="none" stroke="url(#sp)" stroke-width="3"/>` : ""}
      ${lines(l).map((ln, j) => `<text x="${x+7}" y="${y+15+j*11}" font-size="9" fill="${dark ? "#fff" : "#1a1a1c"}">${esc(ln)}</text>`).join("")}
      <text x="${x+7}" y="${y+cell-9}" font-size="15" font-weight="700" fill="${dark ? "#fff" : "#1a1a1c"}">${v == null ? "—" : fmt(v)}</text>
      <text x="${x+cell-6}" y="${y+cell-9}" font-size="8" text-anchor="end" fill="${dark ? "#ddd" : "#55544f"}">${lab(n)}</text></g>`; });
  return s + `<defs><linearGradient id="sp"><stop offset="0" stop-color="#f2b134"/><stop offset=".33" stop-color="#ef7a6d"/><stop offset=".66" stop-color="#b27be8"/><stop offset="1" stop-color="#41b8c4"/></linearGradient></defs></svg>`;
}

/* ---------- illustrative models (placeholders, not forecasts) ---------- */
const STORM = [{l:"Moderate", T0:8, cust:30000}, {l:"Major", T0:18, cust:100000}, {l:"Severe", T0:36, cust:250000}];
function model(){
  const A = st.asm, m = st.model, c = m.drone/100, g = m.crews/100, s = STORM[m.size];
  const tot = A.find + A.dispatch + A.repair || 1, f = A.find/tot, d = A.dispatch/tot, r = A.repair/tot;
  const pf = f*(1 - A.dFind*c), pd = d*(1 - A.cDispatch*g), pr = r*(1 - A.cRepair*g), after = s.T0*(pf+pd+pr);
  return {s, before:s.T0, after, saved:s.T0 - after, custHrs:s.cust*(s.T0 - after), ph:{f:[f,pf], d:[d,pd], r:[r,pr]}};
}
const WI = {
 dcflex: {title:"What if a data centre accepted a flexible connection?",
  inputs:[["mw","Site demand",50,500,50,"MW","Requested import capacity"],["hours","Curtailment hours a year",0,500,25,"h","Hours the network could ask the site to reduce demand"],["wait","Wait for a firm connection",2,10,1,"years","Placeholder time until reinforcement is complete"]],
  calc(v){ const flexWait = 1, depth = 0.5, lf = 0.8; const sooner = Math.max(0, v.wait - flexWait), mwh = v.mw * v.hours * depth, share = v.hours * depth / (8760 * lf);
    return {head:`${fmt(sooner,0)} years`, sub:"sooner on supply (placeholder)", lines:[`≈ <b>${int(Math.round(mwh/100)*100)} MWh</b> a year reduced at ${int(v.mw)} MW, if each curtailment halves demand`, `≈ <b>${fmt(share*100,1)}%</b> of the site’s annual energy, assuming an 80% load factor`]}; },
  how:"Years sooner = firm wait − 1 year (placeholder flexible-offer time). Energy reduced = site MW × curtailment hours × 50% depth. Share = hours × 50% ÷ (8,760 × 80% load factor). All four constants are placeholders, not network data."},
 queue: {title:"What if applications were triaged before design studies?",
  inputs:[["apps","Applications a year",100,2000,100,"","Connection applications needing a design study"],["nonviable","Share that later drop out",10,70,5,"%","Placeholder: projects that never reach connection"],["acc","Triage hit rate",50,95,5,"%","Placeholder: share of drop-outs flagged correctly"]],
  calc(v){ const days = 10, flagged = v.apps * v.nonviable/100 * v.acc/100, wrong = v.apps * (1 - v.nonviable/100) * 0.05;
    return {head:`${int(Math.round(flagged * days / 10) * 10)} days`, sub:"of design-study effort freed a year (placeholder)", lines:[`≈ <b>${int(flagged)}</b> applications flagged for early checks a year`, `≈ <b>${int(wrong)}</b> viable projects flagged by mistake (5% false-flag rate), so a person always reviews the flag`]}; },
  how:"Days freed = applications × drop-out share × hit rate × 10 study days per application (placeholder). Wrong flags = viable applications × 5% (placeholder). Triage only orders the work; it never rejects an application."}
};
const DIAG = {
 flood: {title:"How a first trial could work", items:[["Inputs","Satellite radar passes, EA / SEPA / NRW flood warnings and published substation locations"],["Processing","Map standing water around each site after heavy rain, even through cloud"],["Output","A short list of sites with water nearby, ordered by customers served"],["Decision","Send barriers, pumps or a crew before water reaches equipment"]],
   unknowns:["How often radar passes are available in time to act","How accurate small-area water mapping is around substations","Which sites already have level sensors"]},
 sst: {title:"How a first trial could work", items:[["Constraint","A substation with little spare demand headroom"],["Option","A power-electronic unit alongside, or instead of, a conventional transformer"],["Test","Power-flow and voltage control, efficiency, protection and reliability"],["Outcome","Headroom released compared with the cost of conventional reinforcement"]],
   unknowns:["Unit cost and expected life at distribution voltages","Protection and fault-level behaviour","Maintenance skills and spares"]}
};

/* ---------- KPIs for the featured card ---------- */
function kpis(s, id){
  const ps = PS[s.id], L = nm(id), out = [];
  if (s.id === "storm") {
    const g = wv("gust20", wxNet(id)), dn = D.dnos.map(n => wv("gust20", n)).filter(v => v != null);
    out.push(id === "gb" || !wxNet(id) ? [`${fmt(Math.max(...dn)/Math.min(...dn))}×`, `gap in storm gust-days between the windiest and calmest DNO area, ${W.short}`, "ERA5 · CC BY 4.0"]
                                       : [fmt(g), `days with gusts ≥ 20 m/s across ${L} sites, ${W.short} (GB ${fmt(wv("gust20","gb"))})`, "ERA5 · CC BY 4.0"]);
  }
  if (s.id === "dcflex") {
    const z = aigz(id), f = (D.datacentres.dno[id] || [])[0];
    if (id === "gb" || !isDNO(id)) { const q = D.datacentres.gb.find(x => /transmission queue/.test(x.label) && /Data-centre/.test(x.label)); out.push([gw(q.value), "of data-centre projects in the GB transmission queue", q.source]); }
    else if (f) out.push([gw(f.value), f.label.toLowerCase() + ` in ${L}`, f.source]);
    else out.push([String(z.length), `AI Growth Zone${z.length === 1 ? "" : "s"} announced in ${L}`, "DSIT · OGL v3"]);
  }
  if (s.id === "queue") {
    const q = D.queues[id];
    if (q && q.levels.length) { const t = q.levels.reduce((a, l) => a + l.entries, 0); out.push([int(t), `entries in ${L}’s published queue registers`, "Network open data"]); }
    else { const t = D.datacentres.gb.find(x => /transmission queue \(2025\)/.test(x.label)); out.push([gw(t.value), "of demand waiting in the GB transmission queue", t.source]); }
  }
  if (s.id === "flood") { const f = D.flood[id]; out.push(f && f.located ? [pct(f.flagged, f.sites), `of ${L} sites in mapped flood warning or flood map areas`, "EA / SEPA / NRW · OGL v3"] : [int((D.flood.gb || {}).flagged), "GB DNO sites in mapped flood areas", "EA / SEPA / NRW · OGL v3"]); }
  if (s.id === "sst") { const h = D.headroom[id]; const all = D.dnos.map(n => D.headroom[n]).filter(Boolean);
    out.push(h ? [pct(h.lt5, h.sites), `of ${L} listed sites have under 5 MW demand headroom`, h.licence] : [int(all.reduce((a, x) => a + x.lt5, 0)), "DNO sites with under 5 MW demand headroom (methods differ)", "DNO open data"]); }
  out.push([String(ps.sub_n), `GB network-innovation projects found on ${ps.sub_label}`, `Keyword check · ${projLine(s.id)} match the wider topic`]);
  return `<div class="kpis">${out.map(k => `<div><b>${k[0]}</b><span>${esc(k[1])}</span><i>${esc(k[2])}</i></div>`).join("")}</div>`;
}

/* ---------- views ---------- */
function chips(id){ return `<div class="chips" role="group" aria-label="Show for network">${D.networks.map(n => `<button type="button" class="chip ${n.id === id ? "on" : ""}" data-net="${n.id}" aria-pressed="${n.id === id}" title="${esc(n.name)}">${esc(n.label)}</button>`).join("")}</div>`; }
function home(){
  const id = st.net, L = lab(id), list = ranked(id), f = list[0], rest = list.slice(1);
  return `<section class="wrap home">
  <div class="hero"><div><div class="date">Early preview · ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})} · ${id === "gb" ? "GB view" : esc(NET[id].name)}</div>
    <h1 tabindex="-1">What’s emerging that<br>${id === "gb" ? "your network" : esc(L)} could be first on</h1></div>
    <div class="legend">Every signal carries two separate draft scores.<br><b>Relevance</b> how much it matters to networks · <b>Evidence</b> how well public data backs it today</div></div>
  ${chips(id)}
  <div class="legendl" aria-label="Labels used on this site">${LBL.od} figure from a named public dataset ${LBL.dr} EFI’s own judgement ${LBL.il} placeholder maths ${LBL.gp} not yet available</div>
  <div class="grid">
   <article class="feat" aria-labelledby="f-h"><span class="fm">${PS[f.id].sub_n === 0 ? "First-mover gap" : esc(f.area)}</span>
    <div class="kick">#1 for ${esc(nm(id))} ${LBL.dr}</div>
    <h2 class="fh" id="f-h">${esc(f.benefit)}</h2><div class="fs">${esc(f.title)}</div>
    <div class="tags">${tag("Relevance", f.rel, f.rel + "/3")}${tag("Evidence", f.ev, f.evl)}</div>${hz(f.hz)}
    ${kpis(f, id)}
    <details class="why"><summary><b>Why ranked here</b> draft score ${f.score}</summary>${whyList(f, false)}</details>
    <div class="ctas">${a(sigHref(f), "See the concept", "btn")} <a class="btn2" href="/workshops" data-sig="${f.id}">Plan a workshop</a></div></article>
   ${rest.map((s, i) => `<article class="card link" aria-labelledby="c-${s.id}">
     <div class="ch"><span class="ico">${ic(s.icon)}</span><span class="num">#${i+2} · ${esc(s.area)}</span></div>
     <h2 class="cb" id="c-${s.id}"><a class="cl" href="${sigHref(s)}">${esc(s.benefit)}</a></h2><div class="ct">${esc(s.title)}</div>
     <div class="why"><b>Why ranked here</b> draft score ${s.score}${whyList(s, false)}</div>
     <div class="foot"><div class="tags">${tag("Relevance", s.rel, s.rel + "/3")}${tag("Evidence", s.ev, s.evl)}</div>${hz(s.hz)}</div></article>`).join("")}
  </div>
  <div class="note">One draft rule ranks the signals for every network: draft EFI scores, plus a +3 first-mover bonus when no GB project matches the signal’s specific focus, plus that network’s public exposure figures where we have them. Ties go to higher relevance, then evidence, then list order. Every point is listed under “Why ranked here”. Data built ${esc(D.built_at)}. ${a("/sources", "Sources and licences")}.</div>
  </section>`;
}

function stormWhy(id){
  const wid = wxNet(id), metrics = ["gust20","gust25","rain20","hot30"];
  const rows = metrics.map(m => `<div class="wr"><span>${MET[m].l}</span><b>${wid ? fmt(wv(m, wid)) : "—"}</b><span class="mut">GB ${fmt(wv(m, "gb"))}</span></div>`).join("");
  const mx = Math.max(...D.dnos.map(x => wv("gust20", x) || 0));
  const dnoBars = D.dnos.map(n => { const v = wv("gust20", n); return `<div class="gb ${n === id ? "sel" : ""}"><div class="gbw"><div style="height:${mx ? v/mx*90 : 0}px"></div></div><b>${fmt(v)}</b><span>${lab(n)}</span></div>`; }).join("");
  const iis = D.faults.iis[id], fo = D.faults.open_fault_data[id], ew = D.faults.enwl_weather_incidents;
  let rel = iis ? `Interruptions Incentive Scheme ${D.faults.iis_period}: <b>${ord(iis.rank)} of 6</b> DNO groups · ${iis.reward_gbp_m >= 0 ? "reward" : "penalty"} £${fmt(Math.abs(iis.reward_gbp_m))}m`
          : id === "gb" ? `Interruptions Incentive Scheme ${D.faults.iis_period}: pick a DNO to see its rank` : "The Interruptions Incentive Scheme applies to DNOs only";
  if (fo) rel += `<br>Open fault records loaded: ${fo.metrics.length} series` + (id === "enwl" && ew ? ` · <b>${int(ew.value)}</b> weather and environment incidents in ${ew.year}` : " · not yet harmonised for comparison");
  return `<div class="mut">${LBL.od} ${esc(W.caption)}</div>
   ${wid ? "" : `<div class="gapnote">${LBL.gp} ERA5 areas exist for the six DNOs and GB only. ${esc(lab(id))} figures are not split out yet, so GB values are shown for comparison.</div>`}
   <div class="wrs">${rows}</div>
   <div class="sub">Storm gust-days by DNO area <span class="mut">(≥ 20 m/s)</span></div><div class="gbs">${dnoBars}</div>
   ${src(`Generated using Copernicus Climate Change Service information 2026 · ERA5 · CC BY 4.0`)}
   <div class="sub">Reliability</div><div class="line">${rel}</div>${src(`Ofgem RIIO-ED2 annual report 2024-25 · OGL v3${fo ? " · " + ext(fo.source, "DNO open fault data") : ""}`)}`;
}
function floodWhy(id){
  const fl = D.flood[id], fs = fl && fl.located ? `<b>${int(fl.flagged)}</b> of ${int(fl.sites)} sites (${pct(fl.flagged, fl.sites)}) in mapped flood warning or flood map areas${fl.partial ? " · some sites have no coordinates and are not checked" : ""}${fl.note ? " · " + esc(fl.note) : ""}`
           : fl ? `${LBL.gp} ${int(fl.sites)} sites listed, but no site coordinates are published yet, so flood exposure can’t be checked` : `${LBL.gp} No site list loaded for this network yet`;
  const mx = Math.max(...D.dnos.map(n => floodShare(n) || 0));
  const b = D.dnos.map(n => { const v = floodShare(n); return `<div class="gb ${n === id ? "sel" : ""}"><div class="gbw"><div style="height:${mx && v ? v/mx*90 : 0}px"></div></div><b>${v == null ? "—" : fmt(v*100,0) + "%"}</b><span>${lab(n)}</span></div>`; }).join("");
  const wid = wxNet(id);
  return `<div class="line">${LBL.od} ${fs}</div>${fl && fl.located ? src(`${esc(fl.source)} · ${esc(fl.licence)} · checked ${esc(fl.as_of)}`) : ""}
   <div class="sub">Share of sites in flood areas, by DNO</div><div class="gbs">${b}</div>
   ${src("Environment Agency, SEPA and Natural Resources Wales flood areas · OGL v3 · DNO site lists from each network’s open data")}
   <div class="sub">Heavy rain</div><div class="kv"><span>Days with ≥ 20 mm rain, ${esc(W.short)}</span><b>${wid ? fmt(wv("rain20", wid)) : "—"}</b><span>Days with ≥ 40 mm rain</span><b>${wid ? fmt(wv("rain40", wid)) : "—"}</b><span>GB, ≥ 20 mm</span><b>${fmt(wv("rain20", "gb"))}</b></div>
   ${src(`${LBL.od} Generated using Copernicus Climate Change Service information 2026 · ERA5 · CC BY 4.0 · ${esc(W.caption)}`)}`;
}
function dcWhy(id){
  const g = D.datacentres.gb, f = D.datacentres.dno[id], z = aigz(id);
  const facts = arr => `<div class="kv">${arr.map(x => `<span>${esc(x.label)}</span><b>${x.unit === "%" ? fmt(x.value,0) + "%" : gw(x.value)}</b>`).join("")}</div>${src(`${LBL.od} ` + [...new Set(arr.map(x => ext(x.url, esc(x.source)) + " · " + esc(x.licence)))].join(" · "))}`;
  let local = "";
  if (isDNO(id)) local = f && f.length ? `<div class="sub">${esc(lab(id))} data-centre demand</div>${facts(f)}` : `<div class="sub">${esc(lab(id))} data-centre demand</div><div class="gapnote">${LBL.gp} ${esc(D.datacentres.gap)}</div>`;
  return `${local}
   <div class="sub">AI Growth Zones ${id === "gb" ? "announced in GB" : "in " + esc(lab(id))}</div>
   ${z.length ? `<div class="kv">${z.map(x => `<span>${esc(x.name)}${id === "gb" ? ` <span class="mut">(${esc(lab(x.network))})</span>` : ""}</span><b>${x.mw ? gw(x.mw) : "—"}</b>`).join("")}</div>${src(`${LBL.od} ${ext(z[0].url, "DSIT AI Growth Zones announcements")} · OGL v3 · capacity where announced`)}`
              : `<div class="line">${isDNO(id) ? "None announced in this area so far." : "Not mapped to transmission or system-operator footprints yet."}</div>`}
   <div class="sub">GB picture</div>${facts(g)}`;
}
function queueWhy(id){
  const rows = Object.entries(D.queues).filter(([n, q]) => q.levels.length).map(([n, q]) => q.levels.map(l => `<tr class="${n === id ? "sel" : ""}"><td>${esc(lab(n))}</td><td>${esc(l.label)}</td><td>${int(l.entries)}</td><td>${l.mw ? gw(l.mw) : "—"}</td></tr>`).join("")).join("");
  const q = D.queues[id], gbq = D.datacentres.gb.filter(x => /queue|flexibility/.test(x.label) && !/Data-centre/.test(x.label));
  const mine = id === "gb" ? "" : q && q.levels.length ? `<div class="line">${LBL.od} ${esc(lab(id))} publishes ${q.levels.map(l => `<b>${int(l.entries)}</b> entries in its ${esc(l.label)}`).join(" and ")}.</div>${src(q.levels.map(l => ext(l.url, esc(l.label))).join(" · ") + ` · loaded ${esc(q.levels[0].loaded)}`)}`
     : `<div class="gapnote">${LBL.gp} ${esc((q && q.note) || "No published connection-queue register loaded for " + lab(id) + " yet.")}</div>`;
  return `${mine}
   <div class="sub">Published queue registers</div>
   <div class="gapnote">Registers differ in scope (generation, demand, embedded, aggregated) and are not comparable between networks. Counts are register rows, not unique projects.</div>
   <table class="asm"><tr><th>Network</th><th>Register</th><th>Rows</th><th>Capacity</th></tr>${rows}</table>
   ${src(`${LBL.od} Each network’s open data portal, loaded ${esc((D.queues.nged.levels[0] || {}).loaded || "")} · licences on the Sources page`)}
   <div class="sub">GB demand queues</div><div class="kv">${gbq.map(x => `<span>${esc(x.label)}</span><b>${x.unit === "%" ? fmt(x.value,0) + "%" : gw(x.value)}</b>`).join("")}</div>
   ${src(`${LBL.od} ` + [...new Set(gbq.map(x => esc(x.source) + " · " + esc(x.licence)))].join(" · "))}`;
}
function sstWhy(id){
  const rows = D.dnos.filter(n => D.headroom[n]).map(n => { const h = D.headroom[n];
    return `<tr class="${n === id ? "sel" : ""}"><td>${esc(lab(n))}</td><td>${int(h.sites)}</td><td>${int(h.lt5)} (${pct(h.lt5, h.sites)})</td><td>${int(h.le0)}</td><td>${esc(h.method)}${h.year ? ", " + h.year : ""}</td></tr>`; }).join("");
  const h = D.headroom[id];
  return `${h ? `<div class="line">${LBL.od} <b>${int(h.lt5)}</b> of ${int(h.sites)} ${esc(lab(id))} sites (${pct(h.lt5, h.sites)}) list under 5 MW of demand headroom; <b>${int(h.le0)}</b> list none.</div>${src(`${ext(h.url, esc(h.method))} · ${esc(h.licence)}`)}`
      : `<div class="gapnote">${LBL.gp} Substation headroom is published by DNOs. ${id === "gb" ? "The table shows all six." : esc(lab(id)) + " figures at transmission level aren’t loaded yet."}</div>`}
   <div class="sub">Demand headroom by DNO <span class="mut">(earliest published year)</span></div>
   <div class="gapnote">Each DNO uses its own method and year, so the shares are not like-for-like.</div>
   <table class="asm"><tr><th>DNO</th><th>Sites</th><th>&lt; 5 MW</th><th>≤ 0 MW</th><th>Method</th></tr>${rows}</table>
   ${src(`${LBL.od} DNO network development plans, headroom reports and heat maps · licences on the Sources page`)}`;
}
const WHY = {storm:stormWhy, flood:floodWhy, dcflex:dcWhy, queue:queueWhy, sst:sstWhy};
function whyPanel(s, id){
  return `<section class="card why-net" aria-labelledby="why-h"><div class="cth"><h2 class="h3" id="why-h">Why ${id === "gb" ? "your network" : esc(lab(id))}</h2><span class="mut">${id === "gb" ? "GB view" : esc(NET[id].name)}</span></div>${WHY[s.id](id)}</section>`;
}
function tried(s, id){
  const ps = PS[s.id], own = projOf(s.id, id), list = (own.length ? own : ps.items).slice(0, 6);
  const by = Object.entries(ps.by_owner).sort((a,b) => b[1]-a[1]).map(([k, v]) => `${k === "none" ? "owner not named" : esc(lab(k))} ${v}`).join(" · ");
  return `<section class="card tried" aria-labelledby="tried-h"><div class="cth"><h2 class="h3" id="tried-h">What’s been tried</h2>${LBL.od}</div>
   <div class="line"><b>${int(ps.n)}</b> of ${int(P.total_innovation)} GB network-innovation projects (${int(P.total)} portal records) match ${esc(ps.kw_label)}. <b>${int(ps.sub_n)}</b> are on ${esc(ps.sub_label)}.</div>
   <div class="mut" style="margin-top:4px">By lead network: ${by || "—"}</div>
   ${id !== "gb" && !own.length ? `<div class="line mut">No ${esc(lab(id))}-led project found by the keyword check, so GB examples are shown.</div>` : ""}
   ${list.map(p => `<div class="tr"><b>${ext(p.url, esc(p.name))}</b><span>${esc(p.owner_network_id ? lab(p.owner_network_id) : "Owner not named")} · ${esc(p.funding_stream || "")} · ${esc(p.status || "")}${p.start_date ? ", " + String(p.start_date).slice(0,4) : ""}${p.sub ? " · specific match" : ""}</span></div>`).join("")}
   ${src(`${esc(P.source)} · ${esc(P.filter)}. A keyword check finds candidates; it can miss projects that use other words.`)}</section>`;
}
function concept(s){
  if (s.concept === "model") { const m = model(), A = st.asm, id = st.net;
    return `<section class="card model" aria-labelledby="con-h"><div class="cth"><h2 id="con-h"><b>Try it: how much faster could you restore?</b></h2>${LBL.il}</div>
    <div class="tryg"><div><div class="mapsw" role="group" aria-label="Shade map by">${Object.keys(MET).map(k => `<button type="button" class="ms ${k === st.metric ? "on" : ""}" data-met="${k}" aria-pressed="${k === st.metric}">${MET[k].s}</button>`).join("")}</div>
      <div id="mapbox">${map(id, st.metric)}</div>
      ${src(`Schematic licence areas, not to scale. Shaded by ${MET[st.metric].l.toLowerCase()}, DNO area means, ${esc(W.short)}. ${id === "gb" ? "" : "Outlined: " + esc(lab(id)) + " footprint" + (isDNO(id) ? "" : " (approximate)") + "."}`)}</div>
     <div class="ctl">
      <label class="sl"><span class="slh"><span>Drone patrol coverage</span><b id="vDrone">${st.model.drone}%</b></span><input type="range" min="0" max="100" step="5" value="${st.model.drone}" data-k="drone" aria-describedby="h-drone"><span class="hint" id="h-drone">Share of the damaged overhead network patrolled by drone in the first hours</span></label>
      <label class="sl"><span class="slh"><span>Remote-guided crews</span><b id="vCrews">${st.model.crews}%</b></span><input type="range" min="0" max="100" step="5" value="${st.model.crews}" data-k="crews" aria-describedby="h-crews"><span class="hint" id="h-crews">Share of crews dispatched from drone or robot findings rather than ground patrol</span></label>
      <label class="sl"><span class="slh"><span>Storm size</span><b id="vSize">${m.s.l}</b></span><input type="range" min="0" max="2" step="1" value="${st.model.size}" data-k="size" aria-valuetext="${m.s.l}"><span class="ticks" aria-hidden="true"><span>Moderate</span><span>Major</span><span>Severe</span></span></label>
      <div class="res" id="res" aria-live="polite">${resHTML(m)}</div>
      <details class="how"><summary>How this is calculated</summary>
       <p><b>Restore time after = T₀ × [ f·(1 − e<sub>d</sub>·c) + d·(1 − e<sub>g,d</sub>·g) + r·(1 − e<sub>g,r</sub>·g) ]</b></p>
       <p>T₀ is the placeholder baseline restore time for the storm size. c is drone coverage and g is the remote-guided crew share. f, d and r are the shares of restore time spent finding damage, dispatching and travelling, and repairing. The e values are the maximum time cut for each phase. Customer-hours avoided = customers affected × hours sooner.</p>
       <table class="asm"><tr><th>Assumption</th><th>Value</th><th>Basis</th></tr>
        <tr><td>Baseline T₀ (Moderate / Major / Severe)</td><td>8 / 18 / 36 h</td><td>Placeholder</td></tr>
        <tr><td>Customers affected (Moderate / Major / Severe)</td><td>30k / 100k / 250k</td><td>Placeholder</td></tr>
        ${[["find","Share finding damage, f"],["dispatch","Share dispatch and travel, d"],["repair","Share repairing, r"],["dFind","Max cut to finding from drones, e_d"],["cDispatch","Max cut to dispatch from remote guidance, e_g,d"],["cRepair","Max cut to repair from remote guidance, e_g,r"]]
          .map(([k, l]) => `<tr><td>${l}</td><td><input type="number" min="0" max="1" step="0.05" value="${A[k]}" data-a="${k}" aria-label="${l}"></td><td>Placeholder · editable</td></tr>`).join("")}
       </table>
       <p class="mut">None of these numbers come from network data. They are placeholders that show how the mechanism works. Shares are normalised to add up to 1. A discovery workshop would replace them with the network’s own fault, patrol and crew records. The model doesn’t change with the selected network.</p></details>
      <a class="btn" href="/workshops" data-sig="storm">Explore this in a discovery workshop</a></div></div></section>`; }
  if (s.concept === "whatif") { const w = WI[s.id], v = st.wi[s.id];
    return `<section class="card model wi" aria-labelledby="con-h"><div class="cth"><h2 id="con-h"><b>${esc(w.title)}</b></h2>${LBL.il}</div>
     <p class="mut" style="margin-top:6px">A light what-if to make the idea concrete. Every value is a placeholder, and it doesn’t change with the selected network.</p>
     <div class="ctl">${w.inputs.map(([k, l, mn, mx, stp, u, hint]) => `<label class="sl"><span class="slh"><span>${l}</span><b id="wv-${k}">${int(v[k])}${u === "%" ? "%" : u ? " " + u : ""}</b></span><input type="range" min="${mn}" max="${mx}" step="${stp}" value="${v[k]}" data-w="${k}" data-sigw="${s.id}" data-u="${u}" aria-describedby="wh-${k}"><span class="hint" id="wh-${k}">${hint}</span></label>`).join("")}
      <div class="res" id="wres" aria-live="polite">${wiHTML(s.id)}</div>
      <details class="how"><summary>How this is calculated</summary><p>${esc(w.how)}</p></details>
      <a class="btn" href="/workshops" data-sig="${s.id}">Explore this in a discovery workshop</a></div></section>`; }
  const d = DIAG[s.id];
  return `<section class="card model" aria-labelledby="con-h"><div class="cth"><h2 id="con-h"><b>${esc(d.title)}</b></h2><span class="lbl il">Static concept diagram</span></div>
   <div class="diag" role="list">${d.items.map(([h, t], i) => `<div role="listitem"><span class="num" aria-hidden="true">0${i+1}</span><b>${esc(h)}</b>${esc(t)}</div>`).join("")}</div>
   <div class="sub">What we don’t know yet</div><ul style="margin:6px 0 0 18px;font-size:13px">${d.unknowns.map(u => `<li>${esc(u)}</li>`).join("")}</ul>
   ${src("A concept sketch for discussion, not a design. No figures on this card.")}
   <div style="margin-top:12px"><a class="btn" href="/workshops" data-sig="${s.id}">Explore this in a discovery workshop</a></div></section>`;
}
function wiHTML(k){ const r = WI[k].calc(st.wi[k]);
  return `<div class="rv"><b>${r.head}</b><span>${esc(r.sub)}</span></div>${r.lines.map(l => `<div class="rk">${l}</div>`).join("")}<span class="illu">Illustrative</span> <span class="rn">Placeholder assumptions, not a forecast.</span>`; }
function resHTML(m){
  const bar = n => `<div class="pbar" aria-hidden="true">${["f","d","r"].map(k => `<div class="phase ${k}" style="flex:${m.ph[k][n]}"></div>`).join("")}${n ? `<div style="flex:${1 - (m.ph.f[1]+m.ph.d[1]+m.ph.r[1])}"></div>` : ""}</div>`;
  return `<div class="rl">Average time to restore after a ${m.s.l.toLowerCase()} storm</div>
   <div class="rv"><s><span class="sr">from </span>${fmt(m.before,0)} h</s><b><span class="sr">to </span>${fmt(m.after)} h</b><span>${fmt(m.saved)} hours sooner</span></div>
   <div class="pb"><span>Now</span>${bar(0)}</div><div class="pb"><span>With</span>${bar(1)}</div>
   <div class="plg" aria-hidden="true"><span><i class="phase f"></i>Finding damage</span><span><i class="phase d"></i>Dispatch and travel</span><span><i class="phase r"></i>Repair</span></div>
   <div class="rk">≈ <b>${int(Math.round(m.custHrs/1000)*1000)}</b> customer-hours avoided for ${int(m.s.cust)} customers affected</div>
   <span class="illu">Illustrative</span> <span class="rn">Placeholder assumptions, not a forecast.</span>`;
}
function signal(s){
  const id = st.net, L = lab(id), ps = PS[s.id], r = ranked(id), pos = r.findIndex(x => x.id === s.id), me = r[pos];
  return `<section class="wrap sig">
  <nav class="crumb" aria-label="Breadcrumb"><a href="/">Opportunities</a> › ${esc(s.area)} › ${esc(s.short)} ${id !== "gb" ? `· viewing for <b>${esc(L)}</b>` : ""}</nav>
  <nav class="signav" aria-label="Signals">${S.map(x => `<a href="${sigHref(x)}" ${x.id === s.id ? 'aria-current="page"' : ""}>${esc(x.short)}</a>`).join("")}</nav>
  <div class="shero"><div><span class="fm">${ps.sub_n === 0 ? "First-mover gap" : esc(s.area)}</span><h1 tabindex="-1">${esc(s.benefit)}</h1>
    <p class="pitch"><b>${esc(s.title)}.</b> ${esc(s.pitch)}</p>
    <p class="pitch" style="font-size:14.5px"><b>How it links to networks.</b> ${esc(s.link)}</p></div>
   <div class="card scores"><div class="tags">${tag("Relevance", s.rel, s.rel + "/3")}${tag("Evidence", s.ev, s.evl)}</div>${hz(s.hz)}
    <div class="why"><b>Why ranked here</b> #${pos+1} of ${S.length} for ${esc(nm(id))}${whyList(me)}</div>
    ${src(`${LBL.dr} Relevance, evidence and horizon are draft EFI assessments. ${projLine(s.id)} match this topic; ${ps.sub_n === 0 ? "none" : int(ps.sub_n)} on ${esc(ps.sub_label)}.`)}</div></div>
  <ol class="steps" aria-label="Concept storyboard">${s.steps.map((x, i) => `<li class="step" style="--i:${i}"><div class="sn" aria-hidden="true">0${i+1}</div><span class="ico">${ic(x[0], 26)}</span><b>${esc(x[1])}</b><span>${esc(x[2])}</span></li>`).join("")}</ol>
  <div class="two"><div class="col">${concept(s)}${useful(s)}</div><div class="col">${whyPanel(s, id)}${tried(s, id)}</div></div>
  </section>`;
}

/* ---------- feedback forms (POST /api/feedback; nothing else is sent) ---------- */
const PRIV = `<p class="privnote">We store your answers to improve EFI. Contact details are kept only if you tick the box. See the ${a("/privacy", "privacy notice")}.</p>`;
function contact(prefix, required){
  return `<fieldset><legend>${required ? "Your details" : "Your details <span class=\"mut\">(optional)</span>"}</legend><div class="frow">
   <label class="fld">Name <input name="name" autocomplete="name" maxlength="120"></label>
   <label class="fld">Email${required ? " (required)" : ""} <input name="email" type="email" autocomplete="email" maxlength="200" ${required ? "required" : ""}></label>
   <label class="fld">Organisation <input name="organisation" autocomplete="organization" maxlength="160"></label></div>
   <label class="chk"><input type="checkbox" name="consent" value="yes" ${required ? "required" : ""}> <span>${required ? "Lightleap may contact me about this workshop request and store my details for that purpose (required)." : "Lightleap may contact me about my feedback. Without this tick we don’t keep any name, email or organisation."}</span></label></fieldset>
   <div class="hp" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>`;
}
const fform = (kind, inner, btn, extra="") => `<form class="ff" data-kind="${kind}" data-t="${Date.now()}" novalidate ${extra}>${inner}<div class="fmsg" role="status" aria-live="polite"></div><button class="btn" type="submit">${btn}</button>${PRIV}</form>`;
function useful(s){
  const f = st.fb[s.id] || {};
  if (f.sent) return `<section class="card fbk" aria-labelledby="fb-h"><h2 id="fb-h">Thank you</h2><p>Your feedback on this signal has been recorded.</p></section>`;
  return `<section class="card fbk" aria-labelledby="fb-h"><h2 id="fb-h">Was this useful?</h2>
   ${fform("signal", `<input type="hidden" name="signal" value="${s.id}"><div class="yn" role="group" aria-label="Was this useful?"><button type="button" data-useful="yes" aria-pressed="${f.useful === "yes"}">Yes</button><button type="button" data-useful="no" aria-pressed="${f.useful === "no"}">Not really</button></div>
    <input type="hidden" name="useful" value="${f.useful || ""}">
    <label class="fld">What would make it more useful? <span class="mut">(optional)</span><textarea name="comment" maxlength="2000" rows="3"></textarea></label>
    <details><summary class="mut">Add your details if you’d like a reply</summary>${contact("s", false)}</details>`, "Send feedback")}</section>`;
}
function feedbackPage(){
  return `<section class="wrap prose"><h1 tabindex="-1">Feedback</h1><p>This is an early preview. Tell us what’s missing, wrong or confusing, or what you’d want to see for your network. You don’t need to give your name.</p>
  <div class="card">${fform("general", `<label class="fld">Your feedback (required) <textarea name="comment" maxlength="4000" rows="6" required></textarea></label>
   <label class="fld">Which network are you thinking about? <span class="mut">(optional)</span><select name="network"><option value="">Not specific</option>${D.networks.map(n => `<option value="${n.id}" ${n.id === st.net && n.id !== "gb" ? "selected" : ""}>${esc(n.name)}</option>`).join("")}</select></label>
   ${contact("g", false)}`, "Send feedback")}</div></section>`;
}
async function submitForm(form){
  const msg = $(".fmsg", form), fd = new FormData(form), body = Object.fromEntries(fd.entries()), kind = form.dataset.kind;
  body.kind = kind; body.consent = fd.get("consent") === "yes"; body.elapsed_ms = Date.now() - Number(form.dataset.t || 0); body.page = location.pathname;
  if (!body.network) body.network = st.net;
  if (kind === "workshop") Object.assign(body, {network: st.wk.net || st.net, signal: st.wk.signal, funding_route: st.wk.route, notes: st.wk.notes});
  const hasContact = ["name","email","organisation"].some(k => (body[k] || "").trim());
  const fail = t => { msg.className = "fmsg err"; msg.textContent = t; };
  if (kind === "signal" && !body.useful && !(body.comment || "").trim()) return fail("Choose Yes or Not really, or add a comment.");
  if (kind === "general" && !(body.comment || "").trim()) return fail("Please add your feedback.");
  if (kind === "workshop" && (!body.email || !body.consent)) return fail("We need an email address and your agreement to contact you about the workshop.");
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return fail("That email address doesn’t look right.");
  if (hasContact && !body.consent) return fail("Tick the box to let us keep your details, or clear the name, email and organisation fields.");
  const btn = $("button[type=submit]", form); btn.disabled = true; msg.className = "fmsg"; msg.textContent = "Sending…";
  try {
    const r = await fetch("/api/feedback", {method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify(body), credentials:"same-origin"});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { btn.disabled = false; return fail(j.error || "Sorry, that didn’t send. Please try again in a minute."); }
    if (kind === "signal") { st.fb[body.signal] = {sent:true}; const c = form.closest(".fbk"); c.innerHTML = `<h2 id="fb-h" tabindex="-1">Thank you</h2><p>Your feedback on this signal has been recorded.</p>`; $("#fb-h", c).focus(); return; }
    form.innerHTML = `<p class="fmsg ok" role="status" tabindex="-1">${kind === "workshop" ? "Thank you. Your workshop request has been sent to Lightleap, and we’ll reply by email." : "Thank you. Your feedback has been recorded."}</p>`; $(".fmsg", form).focus();
  } catch (e) { btn.disabled = false; fail("Sorry, that didn’t send. Check your connection and try again."); }
}

/* ---------- workshop flow ---------- */
const ROUTES = {
 NIA:{l:"NIA", n:"Network Innovation Allowance", d:"The licensee’s own RIIO innovation allowance. Projects are registered on the ENA Smarter Networks Portal.", o:"A draft problem statement and NIA project scope: trial area, partners, success measures."},
 SIF:{l:"SIF", n:"Strategic Innovation Fund", d:"Ofgem’s competitive fund, delivered with Innovate UK in Discovery, Alpha and Beta phases.", o:"A check of fit against the current SIF challenges, plus a Discovery-phase consortium and work-package sketch."},
 BAU:{l:"BAU", n:"Business as usual", d:"Funded from operational budgets as a business change rather than an innovation project.", o:"Inputs for a business case, a shortlist of trial sites and a procurement route."},
 Other:{l:"Other", n:"Other route", d:"For example a partner-funded, research council or supplier-led trial.", o:"A list of funding options to explore, with owners and next steps."}};
function workshop(){
  const w = st.wk; if (!w.net) w.net = st.net;
  const stepper = `<ol class="stepper" aria-label="Steps">${["Network","Signal","Funding route"].map((t, i) => `<li class="${w.step === i+1 ? "on" : w.step > i+1 ? "done" : ""}" ${w.step === i+1 ? 'aria-current="step"' : ""}><span aria-hidden="true">${w.step > i+1 ? ic("check",14) : i+1}</span>${t}</li>`).join("")}</ol>`;
  let body = "";
  if (w.step === 1) body = `<fieldset><legend class="h2l"><h2 tabindex="-1">Which network is this workshop for?</h2></legend><div class="opts">${D.networks.map(n => `<label class="opt ${w.net === n.id ? "on" : ""}"><input type="radio" name="net" value="${n.id}" ${w.net === n.id ? "checked" : ""}><b>${esc(n.label)}</b><span>${esc(n.name)}</span></label>`).join("")}</div></fieldset>`;
  if (w.step === 2) body = `<fieldset><legend class="h2l"><h2 tabindex="-1">Which signal should it explore?</h2></legend><div class="opts col1">${S.map(s => `<label class="opt ${w.signal === s.id ? "on" : ""}"><input type="radio" name="sig" value="${s.id}" ${w.signal === s.id ? "checked" : ""}><span class="ico">${ic(s.icon)}</span><b>${esc(s.benefit)}</b><span>${esc(s.title)}</span></label>`).join("")}</div></fieldset>`;
  if (w.step === 3) body = `<fieldset><legend class="h2l"><h2 tabindex="-1">How might it be funded?</h2></legend><div class="opts">${Object.entries(ROUTES).map(([k, r]) => `<label class="opt ${w.route === k ? "on" : ""}"><input type="radio" name="route" value="${k}" ${w.route === k ? "checked" : ""}><b>${r.l}</b><span>${r.n}</span></label>`).join("")}</div></fieldset>
    <label class="notes">Anything else to cover? <span class="mut">(optional)</span><textarea id="wkNotes" rows="3" maxlength="2000">${esc(w.notes)}</textarea></label>`;
  const ok = (w.step === 1 && w.net) || (w.step === 2 && w.signal) || (w.step === 3 && w.route);
  return `<section class="wrap wk"><nav class="crumb" aria-label="Breadcrumb"><a href="/">Opportunities</a> › Workshops</nav>
   <div class="wkh"><h1 tabindex="-1">Plan a discovery workshop</h1></div>
   <p class="pitch">A 2.5-hour session with your team to test one signal against your own data and agree a next step. Plan it here, print the outline, and send it to Lightleap if you’d like us to run it.</p>
   <form class="card wkf" id="wkForm" novalidate>${stepper}${body}
    <div class="wka">${w.step > 1 ? `<button type="button" class="btn2" data-wk="back">Back</button>` : `<a class="btn2" href="/">Cancel</a>`}
     <button type="button" class="btn" data-wk="next" ${ok ? "" : "disabled"}>${w.step < 3 ? "Next" : "Generate outline"}</button></div>
    <div class="src">Your choices stay in this browser tab until you choose to send a request on the next page.</div></form></section>`;
}
function evidenceLines(s, id){
  const L = lab(id), wid = wxNet(id), fl = D.flood[id], iis = D.faults.iis[id], ps = PS[s.id], own = projOf(s.id, id), ev = [];
  if (s.id === "storm") {
    ev.push(wid ? `Storm gust-days ≥ 20 m/s: <b>${fmt(wv("gust20", wid))}</b> ${esc(W.short)} (GB ${fmt(wv("gust20","gb"))}). ${esc(W.caption.replace(/\.$/, ""))}. Source: ERA5, CC BY 4.0.` : `ERA5 storm figures aren’t split out for ${esc(L)} yet. GB: ${fmt(wv("gust20","gb"))} gust-days ${esc(W.short)}.`);
    if (iis) ev.push(`Interruptions Incentive Scheme ${D.faults.iis_period}: ${ord(iis.rank)} of 6 DNO groups (Ofgem).`);
  }
  if (s.id === "storm" || s.id === "flood") ev.push(fl && fl.located ? `Sites in mapped flood areas: <b>${int(fl.flagged)}</b> of ${int(fl.sites)} (${pct(fl.flagged, fl.sites)}). Source: EA / SEPA / NRW, OGL v3, ${esc(fl.as_of)}.` : `Flood exposure: no site coordinates available for ${esc(L)} yet.`);
  if (s.id === "dcflex") { (D.datacentres.dno[id] || []).forEach(f => ev.push(`${esc(f.label)}: <b>${gw(f.value)}</b> (${esc(f.source)}).`)); const z = aigz(id); ev.push(`AI Growth Zones ${id === "gb" ? "announced in GB" : "in " + esc(L)}: <b>${z.length}</b>${z.length ? " (" + z.map(x => esc(x.name)).join("; ") + ")" : ""} (DSIT).`);
    const q = D.datacentres.gb.find(x => /Data-centre projects/.test(x.label)); if (q) ev.push(`Data-centre projects in the GB transmission queue: <b>${gw(q.value)}</b> (${esc(q.source)}).`); }
  if (s.id === "queue") { const q = D.queues[id]; ev.push(q && q.levels.length ? `${esc(L)} published registers: ${q.levels.map(l => `<b>${int(l.entries)}</b> rows in its ${esc(l.label)}`).join("; ")}. Registers differ in scope.` : `No published queue register loaded for ${esc(L)} yet.`);
    const t = D.datacentres.gb.find(x => /transmission queue \(2025\)/.test(x.label)); if (t) ev.push(`Demand waiting in the GB transmission queue: <b>${gw(t.value)}</b> (${esc(t.source)}).`); }
  if (s.id === "sst") { const h = D.headroom[id]; ev.push(h ? `<b>${int(h.lt5)}</b> of ${int(h.sites)} sites under 5 MW demand headroom (${esc(h.method)}, ${esc(h.licence)}).` : "Substation headroom is published by each DNO; methods differ."); }
  ev.push(`${projLine(s.id)} match ${esc(ps.kw_label)}, ${own.length} ${id === "gb" ? "listed here" : "led by " + esc(L)}. ${int(ps.sub_n)} on ${esc(ps.sub_label)} (keyword check, ENA Smarter Networks Portal).`);
  if (s.id === "storm") { const m = model(); ev.push(`Illustrative model with the current slider settings: ${m.s.l.toLowerCase()} storm, restore time ${fmt(m.before,0)} h → ${fmt(m.after)} h. <i>Placeholder assumptions only.</i>`); }
  if (WI[s.id]) { const r = WI[s.id].calc(st.wi[s.id]); ev.push(`Illustrative what-if with the current settings: ${esc(r.head)} ${esc(r.sub)}. <i>Placeholder assumptions only.</i>`); }
  return {ev, own};
}
function outline(){
  const w = st.wk, id = w.net || st.net, L = lab(id), N = NET[id], s = SIG[w.signal] || S[0], r = ROUTES[w.route || "NIA"], {ev, own} = evidenceLines(s, id);
  const ag = [["0:00","Welcome and the problem in your words", s.id === "storm" ? "What happens in the first six hours after a major storm today?" : "Where does this problem show up today?"],["0:20","Evidence walk-through","The public figures above. What do they miss, and what do your own records show?"],
    ["0:45","Concept storyboard",esc(s.title) + ": walk through each step and mark where time is lost or saved."],["1:15","Break",""],
    ["1:25","Assumptions clinic", s.concept === "diagram" ? "Test the concept diagram against your own sites and data, and name the data owners." : "Replace the placeholder values with your own estimates and name the data owners."],["1:55","Route and next steps",esc(r.n) + ": " + esc(r.o)],["2:25","Close","Agree owners, dates and the evidence still needed."]];
  const today = new Date().toLocaleDateString("en-GB");
  return `<section class="wrap outline"><div class="no-print obar"><a href="/workshops" data-wk="edit" class="btn2">Edit choices</a><button type="button" class="btn" id="printBtn">Print or save as PDF</button></div>
  <article class="sheet" aria-labelledby="ol-h"><header class="sh"><div class="mk small"><b>efi</b><div><i></i><span>energy frontier intelligence</span></div></div><div class="shm">Discovery workshop outline · draft · ${today}</div></header>
   <h1 id="ol-h" tabindex="-1">${esc(s.benefit)}</h1><div class="shs">${esc(s.title)} · for <b>${esc(N.name)}</b> · route: <b>${esc(r.l)}</b> (${esc(r.n)})</div>
   <div class="sg"><div><h3>Purpose</h3><p>Test whether ${esc(s.title.charAt(0).toLowerCase() + s.title.slice(1))} would deliver the benefit above for ${esc(id === "gb" ? "GB networks" : L)}. Agree what evidence is needed and shape a ${esc(r.l)} next step.</p>
     <h3>Evidence pack (public data)</h3><ul>${ev.map(e => `<li>${e}</li>`).join("")}</ul>
     <h3>Questions to answer</h3><ul>${s.questions.map(q => `<li>${esc(q)}</li>`).join("")}<li>What data would prove the benefit, and who owns it?</li><li>What has already been tried, here or elsewhere, and what did it show?</li></ul></div>
    <div><h3>Agenda · 2.5 hours</h3><table class="ag">${ag.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}</b>${x[2] ? `<br><span>${x[2]}</span>` : ""}</td></tr>`).join("")}</table>
     <h3>Who to invite</h3><p>${esc(s.invite)}</p>
     <h3>Funding route: ${esc(r.l)}</h3><p>${esc(r.d)}</p><p><b>Workshop output:</b> ${esc(r.o)}</p>
     ${w.notes ? `<h3>Also cover</h3><p>${esc(w.notes)}</p>` : ""}
     ${own.length ? `<h3>Related projects</h3><ul>${own.slice(0,4).map(p => `<li>${esc(p.name)} (${esc(p.funding_stream || "")}, ${esc(p.status || "")})</li>`).join("")}</ul>` : ""}</div></div>
   <footer class="sf">Draft generated by EFI (early preview), ${today}. Figures come from public open data, as cited; ERA5 figures generated using Copernicus Climate Change Service information 2026. Relevance and evidence scores are draft EFI assessments, and model outputs are illustrative placeholders. efi.lightleap.co.uk</footer></article>
  <section class="card no-print fbk" aria-labelledby="wr-h" style="max-width:1040px"><h2 id="wr-h">Ask Lightleap to run this workshop</h2>
   <p class="mut">We’ll send your choices above (network, signal, funding route and notes) with your details.</p>
   ${fform("workshop", `<label class="fld">Preferred timing or format <span class="mut">(optional)</span><input name="timing" maxlength="300" placeholder="For example: half-day in person, January"></label>${contact("w", true)}`, "Send workshop request")}</section></section>`;
}

/* ---------- content pages ---------- */
const LIC = [
 ["Copernicus ERA5 weather", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/", "Generated using Copernicus Climate Change Service information 2026. Hersbach, H. et al. (2023): ERA5 hourly data on single levels from 1940 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS), DOI 10.24381/cds.adbb2d47; daily statistics derived from it. Neither the European Commission nor ECMWF is responsible for any use that may be made of the Copernicus information or data it contains. We aggregated the data to licence-area means.", "https://cds.climate.copernicus.eu"],
 ["Environment Agency flood warning areas and flood-monitoring API", "Open Government Licence v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/", "Contains Environment Agency information © Environment Agency and/or database right 2026.", "https://environment.data.gov.uk/flood-monitoring/doc/reference"],
 ["Natural Resources Wales Flood Map for Planning (via DataMapWales)", "Open Government Licence v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/", "Contains Natural Resources Wales information © Natural Resources Wales and database right 2026.", "https://datamap.gov.wales"],
 ["SEPA flood maps", "Open Government Licence v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/", "Contains SEPA data © Scottish Environment Protection Agency and database right 2026. All rights reserved.", "https://map.sepa.org.uk/floodmaps"],
 ["Ofgem RIIO-ED2 Electricity Distribution Annual Report 2024-25 (Interruptions Incentive Scheme)", "Open Government Licence v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/", "Contains public sector information licensed under the Open Government Licence v3.0.", D.faults.iis_source],
 ["NESO data portal: Ten Year Outlook, TEC register and other datasets", "NESO Open Data Licence v1.0", "https://www.neso.energy/data-portal/neso-open-licence", "Supported by National Energy SO Open Data.", "https://www.neso.energy/data-portal"],
 ["National Grid Electricity Distribution (formerly WPD) Connected Data Portal: data-centre study, DFES, connection queue, headroom and site data", "NGED Open Data Licence", "https://commercial.nationalgrid.co.uk/open-data-licence", "Supported by NGED Open Data.", "https://connecteddata.nationalgrid.co.uk"],
 ["Northern Powergrid open data portal: headroom, embedded capacity register and site data", "Northern Powergrid Open Data Licence v1.0", "https://northernpowergrid.opendatasoft.com/p/opendatalicence/", "Supported by Northern Powergrid Open Data.", "https://northernpowergrid.opendatasoft.com"],
 ["UK Power Networks, SP Energy Networks, Electricity North West and SSEN open data portals", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/", "Contains data from UK Power Networks, SP Energy Networks, Electricity North West and Scottish and Southern Electricity Networks, licensed under CC BY 4.0. We have aggregated and summarised it: counts, shares and ranks are EFI’s derived figures, not official statements, and no network endorses this site.", ""],
 ["ENA Smarter Networks Portal: innovation project records", "ENA terms of use", "https://smarter.energynetworks.org", "Project names, statuses and links come from the Energy Networks Association’s Smarter Networks Portal. We use them for non-commercial research and link each project back to its portal page. Check the ENA’s terms before any commercial reuse.", "https://smarter.energynetworks.org"],
 ["DSIT AI Growth Zones announcements and DESNZ publications", "Open Government Licence v3.0", "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/", "Contains public sector information licensed under the Open Government Licence v3.0.", "https://www.gov.uk"],
 ["UK Parliament committee evidence", "Open Parliament Licence v3.0", "https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/", "Contains Parliamentary information licensed under the Open Parliament Licence v3.0.", "https://committees.parliament.uk"],
 ["Fonts: Bricolage Grotesque, Inter, Azeret Mono", "SIL Open Font License 1.1", "/assets/fonts/OFL.txt", "Served from this site. No third-party font service is used.", ""]];
function sources(){
  const wx = W.available ? `${esc(W.caption)}` : "Not loaded";
  const rows = [["Weather (storm, rain, heat)", "Copernicus ERA5 daily statistics", wx, "od"],
   ["Flood exposure", "EA, NRW and SEPA flood areas checked against DNO site lists", `${int((D.flood.gb || {}).flagged)} of ${int((D.flood.gb || {}).sites)} located sites flagged, checked ${esc((D.flood.enwl || {}).as_of || "")}`, "od"],
   ["Reliability", "Ofgem RIIO-ED2 annual report, Interruptions Incentive Scheme", D.faults.iis_period, "od"],
   ["Innovation projects", "ENA Smarter Networks Portal", `${int(P.total)} records, ${int(P.total_innovation)} network-innovation projects (${esc(P.filter)})`, "od"],
   ["Data-centre demand", "NESO Ten Year Outlook, NGED and SSEN publications, DSIT", esc(D.datacentres.gap), "od"],
   ["Connection queues", "NESO TEC register and network queue registers", "Registers differ in scope and are not comparable", "od"],
   ["Substation headroom", "DNO network development plans and heat maps", `${Object.keys(D.headroom).length} DNOs loaded; methods differ`, "od"],
   ["Relevance, evidence and horizon scores", "EFI", "Draft assessments, to be reviewed with networks", "dr"],
   ["Restore-time model and what-ifs", "EFI", "Placeholder assumptions that show the mechanism, not forecasts", "il"]];
  return `<section class="wrap prose wide"><h1 tabindex="-1">Sources and licences</h1>
   <p>Every figure on EFI comes from a named public dataset, or is labelled as a draft EFI assessment or an illustration. We use public sources only. Data was built on ${esc(D.built_at)}${D.input_mode ? ` (${esc(D.input_mode)})` : ""}.</p>
   <div class="tscroll"><table class="asm"><caption class="sr">What each part of the site is based on</caption><tr><th scope="col">What</th><th scope="col">Source</th><th scope="col">Status</th><th scope="col">Label</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${LBL[r[3]]}</td></tr>`).join("")}</table></div>
   <h2>Attributions</h2><div class="lics">${LIC.map(l => `<div class="lic card"><h3>${esc(l[0])}</h3><div class="ln">${l[2].startsWith("/") ? a(l[2], esc(l[1])) : ext(l[2], esc(l[1]))}</div><p>${esc(l[3])}</p>${l[4] ? `<div class="src">${ext(l[4], "Source")}</div>` : ""}</div>`).join("")}</div>
   <h2>What the labels mean</h2><ul><li>${LBL.od} A figure from a named public dataset, shown with its source.</li><li>${LBL.dr} EFI’s own judgement, such as relevance and evidence scores. These are drafts to be tested with networks.</li><li>${LBL.il} Placeholder maths that shows how an idea works. Not a forecast and not network data.</li><li>${LBL.gp} Data we don’t have yet. We say so rather than fill the gap.</li></ul>
   <p>Spotted an error or a missing source? ${a("/feedback", "Tell us")}.</p></section>`;
}
const mail = () => SITE.contactEmail ? `<a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a>` : `the ${a("/feedback", "feedback form")}`;
function about(){
  return `<section class="wrap prose"><h1 tabindex="-1">About EFI</h1>
   <p><b>EFI (energy frontier intelligence)</b> scans public data for emerging technologies and ideas that GB electricity networks could be first to trial. For each signal it pulls together the evidence, what has already been tried, and a concept to test in a discovery workshop.</p>
   <h2>Early preview</h2><p>This is an early preview for discussion. Scores are draft EFI assessments, models use placeholder assumptions, and some data is still loading (the weather figures currently cover one complete year, 2025, and earlier years are still being added). We’d value your view on what’s useful and what’s missing.</p>
   <h2>Balanced across networks</h2><p>EFI applies one transparent rule to every GB network: distribution, transmission and the system operator. It uses public data only. Choose a network at the top of any page to see the same evidence for that network.</p>
   <h2>Lightleap</h2><p>EFI is built by Lightleap, which works with energy networks on innovation discovery and workshops. To talk about a workshop, ${a("/workshops", "plan one here")}, or contact us through ${mail()}.</p>
   <p class="mut">EFI is independent. It isn’t endorsed by any network, Ofgem, NESO or the ENA.</p></section>`;
}
function privacy(){
  const ret = SITE.retentionMonths || 12;
  return `<section class="wrap prose"><h1 tabindex="-1">Privacy notice</h1>
   ${SITE.privacyReviewed ? "" : `<div class="review" role="note"><b>Draft for review.</b> This notice hasn’t been reviewed yet. Items in [brackets] need confirming before launch.</div>`}
   <p>This notice explains what we collect on this site, why, and your rights under UK data protection law (UK GDPR and the Data Protection Act 2018).</p>
   <h2>Who we are</h2><p>The controller is Lightleap Limited (company number 14037950), registered office 82 Oswald Road, Scunthorpe, North Lincolnshire, DN15 7PA. Contact: ${mail()}. [ICO registration number, if applicable.]</p>
   <h2>What we collect</h2><ul>
    <li><b>Feedback you send:</b> whether a signal was useful, your comments, the page and network you were viewing, and the time.</li>
    <li><b>Contact details, only if you tick the consent box:</b> your name, email address and organisation. If you don’t tick it, we don’t keep them.</li>
    <li><b>Workshop requests:</b> your email address (required), plus name, organisation, timing and the choices you made in the workshop planner.</li>
    <li><b>Technical data:</b> our hosting provider processes your IP address to deliver the site and protect it from abuse. We use it briefly in memory to limit repeated submissions. We don’t store it with your feedback.</li></ul>
   <p>Please don’t include sensitive personal information in comments.</p>
   <h2>Why we use it, and our lawful basis</h2><ul>
    <li>To improve EFI using your feedback: <b>legitimate interests</b> (understanding what’s useful to the people the site is for).</li>
    <li>To reply to you or arrange a workshop: <b>consent</b>, which you give by ticking the box. You can withdraw it at any time by contacting us.</li>
    <li>To keep the site secure: <b>legitimate interests</b>.</li></ul>
   <p>We don’t sell your data, use it for advertising, or add you to a mailing list.</p>
   <h2>Who processes it for us</h2><ul>
    <li><b>Vercel Inc.</b> hosts the site. Its functions run in London, but Vercel is a US company, so some data may be processed in the USA [confirm transfer safeguards, such as the UK Extension to the EU-US Data Privacy Framework or the UK IDTA].</li>
    <li><b>Supabase Inc.</b> stores feedback and requests in a database in London (AWS eu-west-2) [confirm transfer safeguards for any support access].</li></ul>
   <h2>How long we keep it</h2><p>We keep feedback and workshop requests for ${ret} months from when you send them, then delete them [confirm]. If a workshop goes ahead, we may keep the related correspondence for as long as we need it for that work.</p>
   <h2>Cookies and storage</h2><ul>
    <li><b>efi_preview</b>: a strictly necessary cookie that remembers you entered the preview password. It lasts 30 days and holds no personal data.</li>
    <li><b>efi.net</b>: a browser storage item that remembers the network you last chose. It never leaves your device.</li></ul>
   <p>We don’t use analytics, advertising or tracking cookies, and we don’t load third-party scripts or fonts.</p>
   <h2>Your rights</h2><p>You can ask to see, correct or delete your data, to restrict or object to how we use it, or to withdraw consent. Contact us through ${mail()}. We’ll reply within one month.</p>
   <p>If you’re unhappy with how we’ve handled your data, you can complain to the Information Commissioner’s Office: ${ext("https://ico.org.uk/make-a-complaint/", "ico.org.uk/make-a-complaint")} or 0303 123 1113.</p>
   <p class="mut">Last updated [date to confirm]. Draft prepared October 2026.</p></section>`;
}
const notFound = () => `<section class="wrap prose"><h1 tabindex="-1">Page not found</h1><p>That page doesn’t exist. It may have moved during the preview.</p><p>${a("/", "Go to the opportunities", "btn")}</p></section>`;

/* ---------- router ---------- */
function route(){
  const p = location.pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return {v: home, t: "Opportunities"};
  const m = p.match(/^\/signals\/([a-z0-9-]+)$/);
  if (m && !SLUG[m[1]] && BYID[m[1]]) { history.replaceState(null, "", `/signals/${BYID[m[1]].slug}`); return route(); } // short alias, e.g. /signals/flood
  if (m && SLUG[m[1]]) return {v: () => signal(SLUG[m[1]]), t: SLUG[m[1]].short, sig: SLUG[m[1]].id};
  const pages = {"/workshops": [workshop, "Plan a workshop"], "/workshops/outline": [outline, "Workshop outline"], "/sources": [sources, "Sources and licences"], "/about": [about, "About"], "/privacy": [privacy, "Privacy notice"], "/feedback": [feedbackPage, "Feedback"]};
  if (pages[p]) return {v: pages[p][0], t: pages[p][1], p};
  return {v: notFound, t: "Page not found", nf: true};
}
const app = $("#app"), live = $("#announce");
function render(focus){
  const r = route();
  if (r.p === "/workshops/outline" && !st.wk.route) { history.replaceState(null, "", "/workshops"); return render(focus); }
  app.innerHTML = r.v();
  app.querySelectorAll("input[type=range]").forEach(fill);
  document.title = `${r.t} · EFI early preview`;
  document.querySelectorAll(".nav a").forEach(x => { const h = x.getAttribute("href"); const on = h === "/" ? location.pathname === "/" || location.pathname.startsWith("/signals") : location.pathname.startsWith(h); x.toggleAttribute("aria-current", false); if (on) x.setAttribute("aria-current", "page"); });
  $("#netSel").value = st.net;
  if (focus === "page") { window.scrollTo(0, 0); const h = $("h1", app); if (h) h.focus({preventScroll:true}); if (live) live.textContent = r.t; }
  else if (focus && typeof focus === "string") { const el = app.querySelector(focus); if (el) el.focus({preventScroll:true}); }
}
/* Range track fill: app.css paints the coloured part of each track to var(--p). Set it from the
   slider's own min/max/value on render and on every input, so the bar follows the thumb. */
function fill(t){ const mn = Number(t.min) || 0, mx = Number(t.max), v = Number(t.value), r = mx > mn ? (v - mn) / (mx - mn) : 0;
  t.style.setProperty("--p", (Math.min(1, Math.max(0, r)) * 100).toFixed(2) + "%"); }
function go(href){ history.pushState(null, "", href); render("page"); }
function setNet(id, focusSel){ if (!NET[id]) return; st.net = id; store.set("efi.net", id); render(focusSel); if (live) live.textContent = `Showing ${NET[id].name}`; }

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("a,button"); if (!t) return;
  if (t.dataset.net) { return setNet(t.dataset.net, `[data-net="${t.dataset.net}"]`); }
  if (t.dataset.met) { st.metric = t.dataset.met; render(`[data-met="${t.dataset.met}"]`); return; }
  if (t.dataset.useful) { const f = t.closest("form"); f.querySelector("[name=useful]").value = t.dataset.useful; f.querySelectorAll("[data-useful]").forEach(b => b.setAttribute("aria-pressed", String(b === t))); st.fb[f.querySelector("[name=signal]").value] = {useful: t.dataset.useful}; return; }
  if (t.dataset.wk === "next") { const w = st.wk; if (w.step < 3) { w.step++; render("#wkForm h2"); } else { w.notes = ($("#wkNotes") || {}).value || ""; go("/workshops/outline"); } return; }
  if (t.dataset.wk === "back") { st.wk.step--; render("#wkForm h2"); return; }
  if (t.dataset.wk === "edit") { e.preventDefault(); st.wk.step = 3; go("/workshops"); return; }
  if (t.id === "printBtn") { window.print(); return; }
  if (t.tagName === "A") {
    const h = t.getAttribute("href");
    if (!h || !h.startsWith("/") || h.startsWith("//") || t.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button || /^\/(api|assets|data)\//.test(h)) return;
    e.preventDefault();
    if (t.dataset.sig) st.wk = {step: 1, net: st.net, signal: t.dataset.sig, route: st.wk.route, notes: st.wk.notes};
    go(h);
  }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "netSel") return setNet(t.value, "#netSel");
  if (t.name === "net" && t.closest("#wkForm")) { st.wk.net = t.value; render(`[name=net][value="${t.value}"]`); }
  if (t.name === "sig" && t.closest("#wkForm")) { st.wk.signal = t.value; render(`[name=sig][value="${t.value}"]`); }
  if (t.name === "route" && t.closest("#wkForm")) { st.wk.notes = ($("#wkNotes") || {}).value || st.wk.notes; st.wk.route = t.value; render(`[name=route][value="${t.value}"]`); }
  if (t.dataset.a) { const v = Math.min(1, Math.max(0, parseFloat(t.value) || 0)); st.asm[t.dataset.a] = v; paintStorm(); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.type === "range") fill(t);
  if (t.dataset.k) { st.model[t.dataset.k] = Number(t.value); paintStorm(); }
  if (t.dataset.w) { const k = t.dataset.sigw, u = t.dataset.u; st.wi[k][t.dataset.w] = Number(t.value); $("#wv-" + t.dataset.w).textContent = int(t.value) + (u === "%" ? "%" : u ? " " + u : ""); $("#wres").innerHTML = wiHTML(k); }
  if (t.id === "wkNotes") st.wk.notes = t.value;
});
function paintStorm(){
  const m = model(); $("#vDrone").textContent = st.model.drone + "%"; $("#vCrews").textContent = st.model.crews + "%"; $("#vSize").textContent = m.s.l;
  const sz = $("[data-k=size]"); if (sz) sz.setAttribute("aria-valuetext", m.s.l);
  $("#res").innerHTML = resHTML(m);
}
document.addEventListener("submit", e => { const f = e.target.closest("form.ff"); if (f) { e.preventDefault(); submitForm(f); } else if (e.target.id === "wkForm") e.preventDefault(); });
window.addEventListener("popstate", () => render("page"));

/* ---------- init ---------- */
$("#netSel").innerHTML = D.networks.map(n => `<option value="${n.id}">${esc(n.id === "gb" ? "All of GB" : n.name)}</option>`).join("");
render();
})();

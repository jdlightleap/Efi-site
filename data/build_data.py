#!/usr/bin/env python3
"""Bake public/data/data.json (+ data.js) for the EFI early-preview site.

Read-only, run at build time (Vercel buildCommand) or by hand. Two input modes:
  1. SUPABASE_DB_URL set and psycopg installed: runs the SELECTs in source/*.sql against the
     efi-open-data project (ahtyywxcryxnjtvgfjgj) in a READ ONLY session and refreshes source/*.json.
  2. Otherwise: reads the committed exports in data/source/*.json.
The browser never talks to the database. Project keyword rules live in signals_kw.json and are the single
definition used for every count on the site.
"""
import json, os, re, sys, datetime, collections
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source"); OUT = os.path.join(HERE, "..", "public", "data")
FILES = ("core", "projects", "evidence")

def load():
    url = os.environ.get("SUPABASE_DB_URL")
    if url:
        import psycopg  # pip install "psycopg[binary]"
        out = {}
        with psycopg.connect(url) as con:
            con.read_only = True
            with con.cursor() as cur:
                for f in FILES:
                    sql = open(os.path.join(SRC, f + ".sql")).read()
                    sql = "\n".join(l for l in sql.splitlines() if not l.strip().startswith("--")).strip().rstrip(";")
                    cur.execute(sql); out[f] = cur.fetchone()[0]
        for f, d in out.items():
            json.dump(d, open(os.path.join(SRC, f + ".json"), "w"), indent=1, default=str)
        return out, "live read-only query (SUPABASE_DB_URL)"
    return {f: json.load(open(os.path.join(SRC, f + ".json"))) for f in FILES}, "committed exports in data/source/"

# EFI network ids -> UI labels
LABEL = {"gb":"GB","ukpn":"UKPN","spen":"SPEN","ssen_d":"SSEN-D","nged":"NGED","npg":"NPg","enwl":"ENWL",
         "neso":"NESO","nget":"NGET","spt":"SPT","ssen_t":"SSEN-T"}
ORDER = ["gb","ukpn","spen","ssen_d","nged","npg","enwl","neso","nget","spt","ssen_t"]
DNOS = ["ukpn","spen","ssen_d","nged","npg","enwl"]
WMET = {"era5_gust_ge_20_mean":"gust20","era5_gust_ge_25_mean":"gust25",
        "era5_precip_ge_20mm_mean":"rain20","era5_precip_ge_40mm_mean":"rain40","era5_tmax_ge_30c_mean":"hot30"}
MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

def months(period):
    m = re.match(r"(\d{4})-(\d{2})(?:-\d{2})?_(\d{4})-(\d{2})", period) or re.match(r"(\d{4})()_(\d{4})()$", period)
    if not m:
        m2 = re.match(r"^(\d{4})$", period)
        if m2: y = int(m2.group(1)); return [(y, k) for k in range(1, 13)]
        m3 = re.match(r"^(\d{4})-(\d{2})$", period)
        return [(int(m3.group(1)), int(m3.group(2)))] if m3 else []
    y0, m0, y1, m1 = int(m.group(1)), int(m.group(2) or 1), int(m.group(3)), int(m.group(4) or 12)
    out = []; y, k = y0, m0
    while (y, k) <= (y1, m1):
        out.append((y, k)); k += 1
        if k > 12: y, k = y + 1, 1
    return out

def weather(rows):
    """Per network+metric choose the row granularity giving most coverage, then:
       - complete calendar years available -> annual mean of days over those years
       - otherwise -> total days over the months available, flagged as a partial sample."""
    g = collections.defaultdict(list)
    for r in rows or []:
        if r["metric"] in WMET: g[(r["area_key"], WMET[r["metric"]])].append(r)
    res = collections.defaultdict(dict); periods = set()
    for (net, met), rs in g.items():
        byspan = collections.defaultdict(dict)
        for r in rs:
            ms = months(r["period"])
            if ms: byspan[len(ms)][r["period"]] = (ms, r["value"])
        best = max(byspan, key=lambda L: (len({m for ms, _ in byspan[L].values() for m in ms}), -L))
        cov = collections.defaultdict(float); mset = set()
        for ms, v in byspan[best].values():
            for m in ms: mset.add(m)
            for y in {m[0] for m in ms}: cov[y] += v * sum(1 for m in ms if m[0] == y) / len(ms)
        full = sorted(y for y in {m[0] for m in mset} if all((y, k) in mset for k in range(1, 13)))
        if full:
            val = sum(cov[y] for y in full) / len(full); key = ("annual", full[0], full[-1], len(full))
        else:
            val = sum(v for _, v in byspan[best].values()); ms = sorted(mset); key = ("partial", ms[0], ms[-1], len(ms))
        net = "gb" if net == "neso" else net
        res[met][net] = round(val, 2); periods.add(key)
    # one honest caption for the whole set (use the most common period key)
    if not periods: return {"available": False, "caption": "No ERA5 weather loaded yet", "metrics": {}}
    k = sorted(periods)[0]
    if k[0] == "annual":
        cap = f"Annual mean days per year, {k[1]}–{k[2]} ({k[3]} complete years), area mean over each network’s sites"
        short = f"per year, {k[1]}–{k[2]} average"
    else:
        a, b, n = k[1], k[2], k[3]
        span = f"{MON[a[1]-1]} {a[0]}" if a == b else f"{MON[a[1]-1]} {a[0]}–{MON[b[1]-1]} {b[0]}"
        cap = (f"{span} only ({n} month{'s' if n>1 else ''}, test sample) — days in that period, not an annual figure. "
               "Full 2015–2025 history is loading; rerun the build to update.")
        short = f"in {span} (test month)" if n == 1 else f"in {span}"
    return {"available": True, "mode": k[0], "caption": cap, "short": short, "mixed_periods": len(periods) > 1,
            "metrics": res, "source": "Copernicus C3S ERA5 daily statistics (derived-era5-single-levels-daily-statistics)",
            "licence": "CC BY 4.0 — Generated using Copernicus Climate Change Service information"}


SRCNAME = {
 "desnz_strategic_demand_consultation": ("DESNZ strategic demand connections consultation (2025)", "OGL v3"),
 "neso_demand_cfi": ("NESO demand call for input (2025)", "NESO publication"),
 "neso_dcu0081": ("NESO written evidence to UK Parliament (DCU0081)", "Open Parliament Licence"),
 "neso_connections_reform_outcomes": ("NESO connections reform outcomes", "NESO publication"),
 "neso_fes2025_ed1": ("NESO Future Energy Scenarios 2025", "NESO Open Data Licence"),
 "neso_tyo2026_ed1": ("NESO Ten Year Outlook 2026", "NESO Open Data Licence"),
 "nged_dc_impact_study": ("NGED data-centre impact study", "NGED Open Data Licence"),
 "nged_dfes2025_la": ("NGED DFES 2025", "NGED Open Data Licence"),
 "ssen_dfes2025_changelog": ("SSEN DFES 2025 changelog", "SSEN publication"),
 "ssen_dfes2025_sepd_la": ("SSEN DFES 2025 (SEPD, southern England)", "CC BY 4.0"),
 "ssen_dfes2025_shepd_la": ("SSEN DFES 2025 (SHEPD, north of Scotland)", "CC BY 4.0"),
 "dsit_ai_growth_zones": ("DSIT AI Growth Zones announcements", "OGL v3"),
}
def nid(n): return "ssen_d" if n == "ssen" else n

def datacentres(ev):
    rows = ev.get("dc") or []
    def pick(net, metric, scen=None, year=None, level=None, src=None):
        out = [r for r in rows if nid(r["network_id"]) == net and r["metric"] == metric and (scen is None or r["scenario"] == scen)
               and (year is None or r["year"] == year) and (level is None or r["geography_level"] == level) and (src is None or r["source"] == src)]
        return out
    def val(r): return r["value_mw"] if r["value_mw"] is not None else r["value"]
    def fact(label, rs, unit="MW", agg=sum):
        if not rs: return None
        s = rs[0]["source"]; nm, lic = SRCNAME.get(s, (s, rs[0]["licence"]))
        return {"label": label, "value": round(agg(val(r) for r in rs), 1), "unit": unit, "source": nm, "licence": lic, "url": rs[0]["source_url"]}
    gb = [fact("Data-centre capacity connected, 2025", pick("neso", "dc_connected_capacity_total_mw", "Ten Year Outlook", 2025)),
          fact("Data-centre capacity connected, 2030 (Ten Year Outlook)", pick("neso", "dc_connected_capacity_total_mw", "Ten Year Outlook", 2030)),
          fact("Data-centre capacity connected, 2035 (Ten Year Outlook)", pick("neso", "dc_connected_capacity_total_mw", "Ten Year Outlook", 2035)),
          fact("Data-centre projects in the transmission queue", pick("neso", "dc_transmission_queue_mw")),
          fact("All demand waiting in the transmission queue (2025)", pick("neso", "transmission_demand_queue_mw")),
          fact("All demand waiting in distribution queues (2025)", pick("neso", "distribution_demand_queue_mw")),
          fact("Demand projects open to flexibility", pick("neso", "demand_projects_open_to_flex_pct"), "%", max)]
    dno = {}
    for net in ("nged", "ssen_d"):
        lvl = [r for r in pick(net, "dc_installed_capacity_mw" if net == "nged" else "dc_capacity_mw", level="licence_total") if r["scenario"] == "Holistic Transition"]
        f = [fact("Data-centre capacity connected, 2025", pick(net, "dc_connected_capacity_mw", level="curated")),
             fact("Projected data-centre capacity 2030 (DFES, Holistic Transition)", [r for r in lvl if r["year"] == 2030]),
             fact("Projected data-centre capacity 2035 (DFES, Holistic Transition)", [r for r in lvl if r["year"] == 2035])]
        dno[net] = [x for x in f if x]
    sites = [{"name": s["site_name"], "network": nid(s["network_id"]), "region": s["region"], "status": s["status"], "mw": s["capacity_mw"],
              "source": SRCNAME["dsit_ai_growth_zones"][0], "licence": s["licence"], "url": s["source_url"]} for s in ev.get("dc_sites") or []]
    return {"gb": [x for x in gb if x], "dno": dno, "aigz": sites,
            "gap": "Data-centre projections not yet loaded for UKPN, SPEN, NPg and ENWL (their DFES data-centre lines are a planned addition)."}

QLABEL = {"distribution": "distribution connection queue", "transmission": "TEC register (transmission)", "embedded": "embedded capacity register", "interconnector": "interconnector register"}
def queues(ev):
    out = collections.defaultdict(lambda: {"levels": []})
    for q in ev.get("queues") or []:
        n = q["network_id"]
        if n == "ssen_d": continue  # SSEN-D row set is the headroom dashboard, not a queue register
        out[n]["levels"].append({"level": q["level"], "label": QLABEL.get(q["level"], q["level"]), "entries": q["n"], "mw": q["mw"], "url": q["url"], "loaded": q["loaded"]})
    out = dict(out)
    out["ssen_d"] = {"levels": [], "note": "No published connection-queue register loaded for SSEN-D yet (the rows held are its headroom dashboard)."}
    return out

def headroom(ev):
    M = {"ndp_firm_headroom_mva_as_demand": "firm headroom (MVA, network development plan)", "ltds_capacity_heatmap_available": "LTDS capacity heat map",
         "ndp_thermal_year_cols": "network development plan thermal headroom", "ndp_nshr_demand_frc_gen": "network headroom report",
         "ssen_headroom_dashboard_estimated": "headroom dashboard (estimated)", "dfes_nshr_demand_gen_inverter": "DFES network headroom report"}
    return {h["network_id"]: {"sites": h["sites"], "lt5": h["lt5"], "le0": h["le0"], "year": h["yr"], "method": M.get(h["method"], h["method"]),
            "licence": h["lic"], "url": h["url"]} for h in ev.get("headroom") or []}

def main():
    src, mode = load(); core, proj, ev = src["core"], src["projects"], src["evidence"]
    kw = json.load(open(os.path.join(HERE, "signals_kw.json")))
    nets = {n["network_id"]: n for n in core["networks"]}
    networks = [{"id": "gb", "label": "GB", "name": "Great Britain (all networks)", "role": "GB"}]
    for i in ORDER[1:]:
        n = nets.get(i, {}); networks.append({"id": i, "label": LABEL[i], "name": n.get("name", LABEL[i]), "role": n.get("role"), "group": n.get("parent_group")})
    flood = {}
    for f in core.get("flood") or []:
        ok = f["licence"] not in ("n/a",) and f["source"] != "no site xy"
        flood[f["network_id"]] = {"sites": f["sites"], "flagged": f["flagged"] if ok else None, "as_of": f["as_of"],
                                  "source": f["source"].replace("no site xy | ", "").replace(" | no site xy", ""),
                                  "licence": f["licence"].replace("n/a | ", ""), "located": ok, "partial": ok and "no site xy" in f["source"]}
    d = [flood[k] for k in DNOS if k in flood and flood[k]["located"]]
    flood["gb"] = {"sites": sum(x["sites"] for x in d), "flagged": sum(x["flagged"] for x in d), "as_of": max(x["as_of"] for x in d),
                   "source": "EA / SEPA / NRW flood warning and flood map areas", "licence": "OGL v3", "located": True, "note": "Sum of the six DNOs"}
    iis = {}; enwl_w = {}; fault_sets = collections.defaultdict(set); fsrc = {}
    for f in core.get("faults") or []:
        n, m = f["network_id"], f["metric_name"]
        if m == "iis_rank_year": iis.setdefault(n, {})["rank"] = int(f["metric_value"]); iis[n]["year"] = f["year"]; fsrc["iis"] = f["source_url"]
        elif m == "iis_reward_gbp_m": iis.setdefault(n, {})["reward_gbp_m"] = float(f["metric_value"])
        else: fault_sets[n].add(m); fsrc[n] = f["source_url"]
        if n == "enwl" and m == "cause_incidents:Weather and Environment": enwl_w[f["year"]] = int(f["metric_value"])
    yrs = sorted(y for y in enwl_w if y < datetime.date.today().year)
    faults = {"iis": iis, "iis_period": "2024/25 regulatory year", "iis_source": fsrc.get("iis"),
              "open_fault_data": {n: {"metrics": sorted(v), "source": fsrc.get(n)} for n, v in fault_sets.items()},
              "enwl_weather_incidents": {"year": yrs[-1], "value": enwl_w[yrs[-1]]} if yrs else None}
    sig = {}
    for k, s in kw["signals"].items():
        p = proj.get(k) or {}
        sig[k] = {"n": p.get("n", 0), "sub_n": p.get("sub_n", 0), "by_owner": p.get("by_owner") or {}, "kw_label": s["kw_label"], "sub_label": s["sub_label"],
                  "items": [{x: i.get(x) for x in ("name", "status", "funding_stream", "owner_network_id", "start_date", "url", "external_ref", "sub")} for i in (p.get("items") or [])]}
    projects = {"total": proj["total"], "total_innovation": proj["total_innovation"], "by_owner": proj["by_owner"], "signals": sig,
                "filter": "network-innovation funding (NIA, NIC, SIF, IFI) · keyword match on project name or abstract",
                "source": "ENA Smarter Networks Portal", "licence": "ENA Smarter Networks Portal terms (non-commercial use noted)"}
    data = {"built_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "input_mode": mode, "networks": networks, "dnos": DNOS,
            "weather": weather(core.get("weather")), "flood": flood, "faults": faults, "projects": projects,
            "datacentres": datacentres(ev), "queues": queues(ev), "headroom": headroom(ev)}
    os.makedirs(OUT, exist_ok=True)
    # Source pages that moved on the publisher's site since ingestion (link-checked 2026-10-27).
    URL_FIXES = {
        "https://www.neso.energy/data-portal/datasets/transmission-entry-capacity-tec-register": "https://www.neso.energy/data-portal/transmission-entry-capacity-tec-register",
        "https://www.neso.energy/data-portal/datasets/embedded-capacity-register": "https://www.neso.energy/data-portal/embedded-register",
        "https://www.neso.energy/data-portal/datasets/interconnector-register": "https://www.neso.energy/data-portal/interconnector-register",
    }
    s = json.dumps(data, default=str)
    for a, b in URL_FIXES.items(): s = s.replace(json.dumps(a)[1:-1], json.dumps(b)[1:-1])
    data = json.loads(s)
    s = json.dumps(data, indent=1, default=str)
    open(os.path.join(OUT, "data.json"), "w").write(s)
    open(os.path.join(OUT, "data.js"), "w").write("/* generated by data/build_data.py, do not edit */\nwindow.EFI_DATA = " + json.dumps(data, default=str, separators=(",", ":")) + ";\n")
    print(f"built {data['built_at']} from {mode}\n weather: {data['weather']['caption']}")
    for k, v in sig.items(): print(f" projects {k}: {v['n']} match, {v['sub_n']} specific")

if __name__ == "__main__":
    main()

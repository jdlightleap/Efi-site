/* Signal content for the EFI early preview. Relevance / evidence scores are DRAFT EFI assessments, not data. */
window.EFI_SIGNALS = [
 {id:"storm", slug:"storm-resilience", title:"Storm resilience: drones and robotic inspection", short:"Storm resilience",
  benefit:"Get customers back on supply hours sooner after storms", area:"Resilience", rel:3, ev:1, evl:"Emerging", hz:"Near", icon:"storm",
  pitch:"After a big storm, crews lose hours just finding the damage. Drones patrol the overhead lines and robots check flood-hit sites, so every crew hour goes on repairs, not searching.",
  link:"Distribution networks (DNOs) own the overhead lines and the restoration clock. Transmission owners face the same problem on remote routes. Exposure varies with how often each area sees damaging gusts.",
  concept:"model",
  steps:[["storm","Storm passes","Lines and poles down across a wide area"],["drone","Drones launch","Patrol overhead lines and photograph damage"],["robot","Robots check sites","Inspect flood-exposed substations remotely"],["crew","Crews go direct","Straight to the right fault with the right kit"]],
  questions:["Where is restoration time lost today: finding, dispatch or repair?","Which assets and areas suit drone or robot inspection, and what flight and safety permissions would be needed?"],
  invite:"Control room / storm response · Overhead line inspection · Field operations planning · Innovation and funding · Data and GIS · Health, safety and aviation compliance"},
 {id:"dcflex", slug:"data-centre-connections", title:"Flexible connections for data-centre demand", short:"Data-centre connections",
  benefit:"Connect large new demand sooner without waiting years for reinforcement", area:"Connections", rel:3, ev:2, evl:"Moderate", hz:"Near", icon:"dc",
  pitch:"Data centres want large connections quickly. If they accept being turned down for a small number of hours a year, a network can connect them on today's capacity and reinforce later, instead of making them wait.",
  link:"Large sites connect at transmission or high-voltage distribution. DNOs and TOs both make the offers, and NESO runs the transmission queue. AI Growth Zones show where pressure is highest.",
  concept:"whatif",
  steps:[["dc","Request arrives","A large data-centre connection request"],["queue","Check headroom","Firm capacity would need reinforcement"],["sst","Offer flexibility","Connect now with agreed curtailment hours"],["check","Reinforce later","Firm up when the upgrade is complete"]],
  questions:["How many hours a year would curtailment really be needed at the busiest sites?","What would data-centre operators accept, and how would it be monitored?"],
  invite:"Connections and customer offers · System planning · Commercial and contracts · Flexibility / DSO team · Innovation and funding"},
 {id:"queue", slug:"connection-queue-triage", title:"AI triage of the connection queue", short:"Queue triage",
  benefit:"Cut weeks from connection offers by sorting viable projects first", area:"Connections", rel:3, ev:1, evl:"Emerging", hz:"Near", icon:"queue",
  pitch:"Connection queues are full of applications that will never be built. Software that reads applications and flags the likely non-starters early lets engineers spend design time on projects that will connect.",
  link:"Every network publishes a queue or register. Transmission owners and NESO handle the largest queue through the TEC register and connections reform. DNOs manage their own distribution queues.",
  concept:"whatif",
  steps:[["doc","Applications land","Hundreds of requests a month"],["queue","Triage","Flag missing land rights, finance or planning"],["check","Prioritise","Design studies go to viable projects first"],["crew","Faster offers","Engineers spend time where it counts"]],
  questions:["What share of design-study effort goes on applications that later drop out?","Which application fields would a triage model need, and are they already captured?"],
  invite:"Connections engineering · Data and analytics · Regulation (connections reform) · Customer service · Innovation and funding"},
 {id:"flood", slug:"flood-monitoring", title:"Satellite monitoring of flood-exposed substations", short:"Flood monitoring",
  benefit:"Spot rising flood risk at sites before it turns into an outage", area:"Resilience", rel:2, ev:1, evl:"Emerging", hz:"Near", icon:"sat",
  pitch:"Many substations sit in mapped flood areas. Satellite radar can see standing water and ground movement through cloud, so a network can check exposed sites remotely after heavy rain and send defences and crews to the right ones.",
  link:"Every network with substations in flood areas is exposed. The share of mapped sites in flood warning or flood map areas differs by network, as shown below.",
  concept:"diagram",
  steps:[["storm","Heavy rain","Rivers and surface water rise"],["sat","Satellite pass","Radar maps water through cloud"],["doc","Site check","Flood-exposed substations flagged"],["crew","Act early","Barriers and crews where they are needed"]],
  questions:["Which flood-exposed sites have the highest customer impact?","How quickly would a satellite flag need to arrive to be useful?"],
  invite:"Asset management (civil / flood) · Control room · Data and GIS · Emergency planning · Innovation and funding"},
 {id:"sst", slug:"solid-state-transformers", title:"Solid-state transformers at constrained sites", short:"Solid-state transformers",
  benefit:"Release headroom at busy substations with smarter power electronics", area:"Headroom", rel:2, ev:0, evl:"Thin", hz:"Far", icon:"sst",
  pitch:"Solid-state transformers use power electronics to control power flow, voltage and DC links. At substations with little spare capacity they could release headroom without a full rebuild. SP Energy Networks’ LV Engine project has already trialled them at secondary substations in GB, so the open question is where they pay back, not whether they work at all.",
  link:"DNOs publish headroom by substation. Sites with little demand headroom are where a power-electronics option might be tested first. Methods differ by network, as noted below.",
  concept:"diagram",
  steps:[["sst","Constrained site","Little spare demand headroom"],["doc","Assess options","Rebuild vs power electronics"],["check","Pilot unit","Controlled power flow and voltage"],["queue","Release headroom","More connections on the same site"]],
  questions:["Which constrained sites would make a safe first pilot?","What reliability and maintenance evidence would asset teams need first?"],
  invite:"Asset strategy · Protection and control · System planning · Innovation and funding · Supply chain"}
];
/* Schematic licence-area tiles: col,row,label,DNO */
window.EFI_TILES = [[2,0,"North Scotland","ssen_d"],[1.5,1,"Central & South Scotland","spen"],[1,2,"North West","enwl"],[2,2,"North East","npg"],
 [1,3,"Merseyside & N Wales","spen"],[2,3,"Yorkshire","npg"],[1,4,"West Midlands","nged"],[2,4,"East Midlands","nged"],[3,4,"East of England","ukpn"],
 [0,5,"South Wales","nged"],[1,5,"Southern England","ssen_d"],[2,5,"London","ukpn"],[0,6,"South West","nged"],[2,6,"South East","ukpn"]];
/* Which tiles a network's footprint covers (schematic). Transmission / system operator footprints are approximate. */
window.EFI_FOOT = {gb:"*", neso:"*", nget:["enwl","npg","nged","ukpn","ssen_d:Southern England","spen:Merseyside & N Wales"],
 spt:["spen:Central & South Scotland"], ssen_t:["ssen_d:North Scotland"]};
/* Hand-checked GB work for each signal (public pages, read 28 Oct 2026). This replaces the automated
   "no project found" claims: a keyword search is a starting point, not proof that nobody has tried something. */
window.EFI_KNOWN = {
 storm: {note:"GB networks are already trialling this. The open question is how to scale it from pilots to every storm.",
  items:[
   {name:"VOLT (Visual Overhead Line Tracking)", lead:"enwl", fund:"NIA", cost:"£31,973", dates:"Oct 2025–Aug 2026", ref:"NIA_ENWL_043", what:"Feasibility study of beyond-visual-line-of-sight (BVLOS) drone operations for fault finding, including costs, benefits and regulation.", url:"https://smarter.energynetworks.org/projects/nia_enwl_043/"},
   {name:"VOLT Phase 2", lead:"enwl", fund:"NIA", cost:"£1,021,312", dates:"Sep 2026–Nov 2027", ref:"NIA_ENWL_047", what:"Docked drones flown beyond visual line of sight (BVLOS) from a remote operations centre, for storm fault finding and routine inspection.", url:"https://smarter.energynetworks.org/projects/nia_enwl_047/"},
   {name:"StormTriage", lead:"npg", fund:"NIA", cost:"£490,000", dates:"Dec 2023–Mar 2025", ref:"NPG_NIA_047", what:"An app for front-line staff to capture and report storm damage in real time. Proof-of-concept trial with 10 staff.", url:"https://smarter.energynetworks.org/projects/NPG_NIA_047"},
   {name:"StormTriage 2", lead:"npg", fund:"NIA", cost:"£334,400", dates:"Sep 2025–Jul 2026", ref:"NPG_NIA_057", what:"Machine-learning triage of storm damage reports from the field.", url:"https://smarter.energynetworks.org/projects/NPG_NIA_057"}]},
 sst: {note:"Solid-state transformers have been trialled on a GB distribution network. The open question is cost and payback at constrained sites.",
  items:[
   {name:"LV Engine", lead:"spen", fund:"NIC", cost:"£8.3m", dates:"2018–2024, complete", ref:"SPMEN02", what:"Smart transformers (solid-state transformers) trialled at 11 kV / 0.4 kV secondary substations, with UK Power Networks as a partner.", url:"https://www.spenergynetworks.co.uk/pages/lv_engine.aspx"}]},
 queue: {note:"We haven’t finished hand-checking GB work on automated connection-application triage. Connections reform is changing how queues are managed, so related work is likely. Tell us about projects we’ve missed."},
 flood: {note:"We haven’t finished hand-checking GB work on satellite flood monitoring of substations. The keyword search below lists related projects, but it isn’t a complete list. Tell us about projects we’ve missed."},
 dcflex: {note:"Flexible and non-firm connections are already offered by GB networks. The open question is how far large data-centre demand will accept them."}
};
/* Short glossary. Terms are linked to /glossary the first time they appear on a page. */
window.EFI_GLOSSARY = [
 ["BVLOS","Beyond visual line of sight","Flying a drone where the pilot can’t see it directly. In the UK this needs an operational authorisation from the Civil Aviation Authority (CAA)."],
 ["DFES","Distribution Future Energy Scenarios","Each DNO’s published forecasts of how demand and generation could grow in its area."],
 ["DNO","Distribution network operator","The licensed company that runs the local electricity network supplying homes and businesses. GB has 14 licence areas run by six DNO groups."],
 ["ERA5","ERA5 reanalysis","Copernicus’s hourly reconstruction of past weather on a global grid of about 31 km. EFI uses it for gust, rain and heat days."],
 ["Gust-day","Gust-day","A day when the strongest wind gust in an area reaches a set threshold. EFI uses 20 m/s (about 45 mph) and 25 m/s (about 56 mph), averaged over each network’s sites."],
 ["IIS","Interruptions Incentive Scheme","Ofgem’s scheme that rewards or penalises each DNO on the number and length of power cuts against its targets."],
 ["LTDS","Long Term Development Statement","Each DNO’s published data on its network, its capacity and planned works, updated twice a year."],
 ["NESO","National Energy System Operator","The public body that runs the GB electricity system in real time and manages connections to the transmission network."],
 ["NIA","Network Innovation Allowance","Innovation funding each network gets within its Ofgem price control, for smaller projects. Projects are listed on the ENA Smarter Networks Portal."],
 ["NIC","Network Innovation Competition","Ofgem’s earlier competitive fund for larger innovation projects. The SIF replaced it."],
 ["SIF","Strategic Innovation Fund","Ofgem’s competitive fund for larger innovation projects, run with Innovate UK in Discovery, Alpha and Beta phases."],
 ["TEC","Transmission Entry Capacity","The capacity a project has agreed to use on the transmission network. NESO’s TEC register lists projects with, or applying for, these agreements."],
 ["TO","Transmission owner","A company that owns the high-voltage transmission network: National Grid Electricity Transmission (England and Wales), SP Transmission (south Scotland) or SSEN Transmission (north Scotland)."]
];


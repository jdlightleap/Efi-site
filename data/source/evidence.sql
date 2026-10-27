-- run via Supabase SQL connector (read-only); save result column j as source/evidence.json
with y as (select network_id, min(year) yr from evidence_headroom group by 1),
h as (select e.network_id, y.yr, site_name, min(demand_headroom_mw) dh from evidence_headroom e join y using(network_id)
      where demand_headroom_mw is not null and (y.yr is null or e.year = y.yr) group by 1,2,3)
select json_build_object(
'headroom',(select json_agg(x) from (select h.network_id, max(h.yr) yr, count(*) sites, count(*) filter (where dh < 5) lt5, count(*) filter (where dh <= 0) le0,
   (select max(licence) from evidence_headroom e where e.network_id = h.network_id) lic,
   (select max(method) from evidence_headroom e where e.network_id = h.network_id) method,
   (select max(source_url) from evidence_headroom e where e.network_id = h.network_id) url from h group by 1) x),
'dc',(select json_agg(x) from (select network_id, geography_level, metric, scenario, year, value_mw, value, unit, source, licence, source_url, as_of
   from ext_datacentre_capacity where geography_level in ('curated','licence_total','gb') and (geography_level = 'curated' or year in (2025,2030,2035)) order by 1,2,3,4,5) x),
'dc_sites',(select json_agg(x) from (select site_name, programme, region, network_id, status, capacity_mw, announced, source, licence, source_url from ext_datacentre_sites) x),
'queues',(select json_agg(x) from (select network_id, level, count(*) n, round(sum(capacity_mw)) mw, count(distinct queue_name) qn, min(source_url) url, max(created_at)::date loaded
   from evidence_queues group by 1,2) x)
) j;

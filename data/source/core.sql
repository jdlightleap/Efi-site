-- run via Supabase SQL connector; save result column j as source/core.json
select json_build_object(
'networks',(select json_agg(n order by network_id) from (select network_id,name,role,parent_group from networks) n),
'weather',(select json_agg(w) from (select area_key,area_level,period,metric,value,unit,source,licence,raw from ext_weather_area where area_level='network') w),
'flood',(select json_agg(f) from (select network_id, count(*) sites, count(*) filter (where in_flood_warning_area) flagged, string_agg(distinct nation,',') nations, max(created_at)::date as_of, string_agg(distinct source,' | ') source, string_agg(distinct licence,' | ') licence from ext_flood_site_flags group by network_id) f),
'faults',(select json_agg(x) from (select network_id,year,metric_name,metric_value,unit,voltage_band,source_url from evidence_faults where metric_name in ('incident_count','customer_minutes_lost_sum','customers_affected_sum','cause_incidents:Weather and Environment','cause_cml:Weather and Environment','iis_rank_year','iis_reward_gbp_m','customers_restored_sum')) x)
) j;

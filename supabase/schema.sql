create table if not exists public.daily_records (
  day_key date primary key,
  speed_kms double precision not null,
  source text not null,
  source_url text not null,
  observed_at_raw text not null,
  observed_at_utc timestamptz not null,
  fetched_at_utc timestamptz not null,
  quality_code integer,
  raw_sha256 text not null,
  raw_payload text not null,
  created_at_utc timestamptz not null,
  updated_at_utc timestamptz not null
);

create table if not exists public.submission_evidence (
  day_key date primary key,
  speed_kms double precision not null,
  source text not null,
  source_url text not null,
  observed_at_raw text not null,
  observed_at_utc timestamptz not null,
  fetched_at_utc timestamptz not null,
  quality_code integer,
  raw_sha256 text not null,
  raw_payload text not null,
  captured_at_utc timestamptz not null
);

alter table public.daily_records enable row level security;
alter table public.submission_evidence enable row level security;

create or replace function public.save_solar_wind_record(
  p_day_key date,
  p_speed_kms double precision,
  p_source text,
  p_source_url text,
  p_observed_at_raw text,
  p_observed_at_utc timestamptz,
  p_fetched_at_utc timestamptz,
  p_quality_code integer,
  p_raw_sha256 text,
  p_raw_payload text
)
returns setof public.daily_records
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_records (
    day_key, speed_kms, source, source_url, observed_at_raw, observed_at_utc,
    fetched_at_utc, quality_code, raw_sha256, raw_payload, created_at_utc, updated_at_utc
  ) values (
    p_day_key, p_speed_kms, p_source, p_source_url, p_observed_at_raw, p_observed_at_utc,
    p_fetched_at_utc, p_quality_code, p_raw_sha256, p_raw_payload, p_fetched_at_utc, p_fetched_at_utc
  )
  on conflict (day_key) do update set
    speed_kms = excluded.speed_kms,
    source = excluded.source,
    source_url = excluded.source_url,
    observed_at_raw = excluded.observed_at_raw,
    observed_at_utc = excluded.observed_at_utc,
    fetched_at_utc = excluded.fetched_at_utc,
    quality_code = excluded.quality_code,
    raw_sha256 = excluded.raw_sha256,
    raw_payload = excluded.raw_payload,
    updated_at_utc = excluded.updated_at_utc
  where excluded.fetched_at_utc >= public.daily_records.fetched_at_utc;

  perform pg_advisory_xact_lock(hashtext('cosmic-pulse-submission-evidence'));

  insert into public.submission_evidence (
    day_key, speed_kms, source, source_url, observed_at_raw, observed_at_utc,
    fetched_at_utc, quality_code, raw_sha256, raw_payload, captured_at_utc
  )
  select
    p_day_key, p_speed_kms, p_source, p_source_url, p_observed_at_raw, p_observed_at_utc,
    p_fetched_at_utc, p_quality_code, p_raw_sha256, p_raw_payload, p_fetched_at_utc
  where (select count(*) from public.submission_evidence) < 2
     or exists (select 1 from public.submission_evidence where day_key = p_day_key)
  on conflict (day_key) do update set
    speed_kms = excluded.speed_kms,
    source = excluded.source,
    source_url = excluded.source_url,
    observed_at_raw = excluded.observed_at_raw,
    observed_at_utc = excluded.observed_at_utc,
    fetched_at_utc = excluded.fetched_at_utc,
    quality_code = excluded.quality_code,
    raw_sha256 = excluded.raw_sha256,
    raw_payload = excluded.raw_payload,
    captured_at_utc = excluded.captured_at_utc
  where excluded.fetched_at_utc >= public.submission_evidence.fetched_at_utc;

  return query select * from public.daily_records where day_key = p_day_key;
end;
$$;

revoke all on function public.save_solar_wind_record(date, double precision, text, text, text, timestamptz, timestamptz, integer, text, text) from public;
grant execute on function public.save_solar_wind_record(date, double precision, text, text, text, timestamptz, timestamptz, integer, text, text) to service_role;

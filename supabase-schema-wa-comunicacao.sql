create table if not exists wa_groups (
  id uuid primary key default gen_random_uuid(),
  whatsapp_jid varchar(64) not null unique,
  name varchar(120) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists wa_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references wa_groups(id) on delete cascade,
  source_type varchar(40) not null default 'whatsapp_group',
  external_message_id varchar(128),
  bridge_name varchar(80),
  sender_jid varchar(64),
  sender_name varchar(120),
  text_raw text not null,
  message_type varchar(40),
  msg_timestamp bigint,
  analysis_status varchar(20) not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists wa_analysis (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references wa_messages(id) on delete cascade,
  sentiment varchar(16) not null,
  sentiment_score numeric(3,2) not null,
  keywords jsonb not null default '[]'::jsonb,
  topic varchar(40),
  urgency varchar(16) not null default 'baixa',
  summary text,
  flags jsonb not null default '[]'::jsonb,
  model_used varchar(60) not null default 'heuristic-v1',
  analyzed_at timestamptz not null default now()
);

create table if not exists wa_daily_insights (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references wa_groups(id) on delete cascade,
  date date not null,
  total_messages integer not null default 0,
  sentiment_breakdown jsonb not null default '{}'::jsonb,
  top_keywords jsonb not null default '[]'::jsonb,
  urgent_count integer not null default 0,
  executive_summary text,
  generated_at timestamptz not null default now(),
  unique (group_id, date)
);

create table if not exists wa_keywords_config (
  id uuid primary key default gen_random_uuid(),
  keyword varchar(80) not null unique,
  category varchar(40) not null default 'geral',
  alert_level varchar(16) not null default 'info',
  notify_email varchar(120),
  is_active boolean not null default true
);

create index if not exists idx_wa_messages_group_id on wa_messages(group_id);
create index if not exists idx_wa_messages_created_at on wa_messages(created_at desc);
create index if not exists idx_wa_analysis_message_id on wa_analysis(message_id);
create index if not exists idx_wa_daily_insights_group_date on wa_daily_insights(group_id, date desc);
create unique index if not exists uq_wa_messages_external_message_id
  on wa_messages(external_message_id)
  where external_message_id is not null;

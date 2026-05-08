alter table if exists wa_daily_insights
  add column if not exists sentiment_label varchar(16);

alter table if exists wa_daily_insights
  add column if not exists primary_keyword varchar(80);

alter table if exists wa_daily_insights
  add column if not exists urgency_label varchar(16) not null default 'baixa';

alter table if exists wa_daily_insights
  add column if not exists summary_model_used varchar(60) not null default 'local-rollup-v1';

update wa_daily_insights
set urgency_label = coalesce(urgency_label, 'baixa')
where urgency_label is null;

-- life-logger Supabase 初始化 SQL
-- 在 Supabase Dashboard → SQL Editor 里执行此文件

-- 知识碎片表
create table if not exists knowledge_entries (
  id          text primary key,
  sync_key    text not null,          -- 设备同步密钥（用于隔离不同用户数据）
  content     text not null,
  created_at  bigint not null,        -- unix ms
  updated_at  bigint not null,
  deleted     boolean default false   -- 软删除
);

-- 时间记录表
create table if not exists time_entries (
  id          text primary key,
  sync_key    text not null,
  event       text not null,
  category    text,                   -- 可空
  duration    integer not null,       -- 分钟
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean default false
);

-- 索引（按 sync_key + updated_at 查增量）
create index if not exists idx_knowledge_sync on knowledge_entries(sync_key, updated_at);
create index if not exists idx_timetrack_sync on time_entries(sync_key, updated_at);

-- Row Level Security（用 sync_key 作为轻量鉴权）
alter table knowledge_entries enable row level security;
alter table time_entries      enable row level security;

-- 任何人都可以读写自己 sync_key 的数据（anon key 访问）
create policy "knowledge by sync_key" on knowledge_entries
  for all using (true) with check (true);

create policy "timetrack by sync_key" on time_entries
  for all using (true) with check (true);

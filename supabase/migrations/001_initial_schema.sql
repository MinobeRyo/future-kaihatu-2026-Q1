-- profiles
create table if not exists profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  name      text,
  avatar_url text,
  plant_name text,
  created_at timestamptz default now()
);

-- plant_status（履歴積み上げ）
create table if not exists plant_status (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  growth_value integer not null default 0,
  health_value integer not null default 100,
  mental_value integer not null default 100,
  changed_at   timestamptz not null default now(),
  trigger_type text not null check (trigger_type in ('receipt_scan', 'item_use', 'time_decay'))
);
create index on plant_status (user_id, changed_at desc);

-- entertainment_buff
create table if not exists entertainment_buff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  buff_value numeric(4,2) not null default 1.0,
  buff_count integer not null default 0
);

-- receipts
create table if not exists receipts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  store_name            text not null,
  receipt_date          date not null,
  total_amount          integer not null,
  scanned_at            timestamptz not null default now(),
  is_duplicate          boolean not null default false,
  entertainment_intensity text check (entertainment_intensity in ('light', 'medium', 'heavy')),
  food_healthy_ratio    numeric(5,4) not null default 0,
  food_junk_ratio       numeric(5,4) not null default 0,
  food_other_ratio      numeric(5,4) not null default 0,
  daily_goods_ratio     numeric(5,4) not null default 0,
  entertainment_ratio   numeric(5,4) not null default 0
);
create index on receipts (user_id, receipt_date desc);

-- receipt_items
create table if not exists receipt_items (
  id         uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  item_name  text not null,
  category   text not null,
  quantity   integer not null default 1,
  price      integer not null default 0
);

-- item_stock（最大10枠はアプリ側で制御）
create table if not exists item_stock (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  item_name           text not null,
  category            text not null,
  stored_growth_value integer not null default 0,
  health_effect       integer not null default 0,
  mental_effect       integer not null default 0,
  acquired_at         timestamptz not null default now()
);
create index on item_stock (user_id, acquired_at asc);

-- RLS
alter table profiles enable row level security;
alter table plant_status enable row level security;
alter table entertainment_buff enable row level security;
alter table receipts enable row level security;
alter table receipt_items enable row level security;
alter table item_stock enable row level security;

create policy "own data" on profiles for all using (auth.uid() = user_id);
create policy "own data" on plant_status for all using (auth.uid() = user_id);
create policy "own data" on entertainment_buff for all using (auth.uid() = user_id);
create policy "own data" on receipts for all using (auth.uid() = user_id);
create policy "own data" on receipt_items for all
  using (receipt_id in (select id from receipts where user_id = auth.uid()));
create policy "own data" on item_stock for all using (auth.uid() = user_id);

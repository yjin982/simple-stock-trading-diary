-- public 스키마 전체 정의 (참고용 스냅샷)
--
-- Supabase CLI를 쓰지 않아 실제 DB는 대시보드에서 직접 관리한다. 이 파일은 실제 DB를 그대로
-- 옮겨 적은 것으로, 새 DB를 만들 때 이 파일 → migrations/ 순서로 실행하면 같은 상태가 된다.
-- 기준: inspect_schema.sql 조회 결과 + migrations/20261105_02까지 적용 (2026-11-05).
-- 스키마를 바꾸면 migrations/에 파일을 추가하고 이 파일도 함께 고친다.

-- ── enum ───────────────────────────────────────────────

create type public.currency as enum ('KRW', 'USD');                 -- 거래 통화
create type public.account_currency as enum ('KRW', 'USD', 'BOTH'); -- 계좌 통화 (BOTH = KRW+USD)
create type public.market as enum ('KR', 'US');
create type public.trade_type as enum ('BUY', 'SELL');
create type public.exchange as enum ('KOSPI', 'KOSDAQ');            -- 현재 사용하지 않음 (trades.exchange는 text + CHECK)

-- ── accounts ───────────────────────────────────────────

create table public.accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  broker_name    text not null,
  alias          text not null,
  account_number text,
  currency       public.account_currency not null default 'KRW',
  created_at     timestamptz not null default now()
);

create index accounts_broker_id_idx on public.accounts (broker_name);

alter table public.accounts enable row level security;
create policy "accounts: 본인만 접근" on public.accounts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── trades ─────────────────────────────────────────────

create table public.trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 거래가 남아 있는 계좌는 삭제할 수 없다 (앱에서도 같은 안내를 보여 준다)
  account_id  uuid not null references public.accounts (id) on delete restrict,
  type        public.trade_type not null,
  stock_code  text not null,
  stock_name  text not null,
  market      public.market not null,
  exchange    text check (exchange = any (array['KOSPI', 'KOSDAQ'])),
  currency    public.currency not null,
  price       numeric not null default 0,
  quantity    numeric not null default 0,
  -- 시각 없이 날짜만 쓴다. 앱은 앞 10자리(YYYY-MM-DD)만 사용하고 트리거는 trade_date::date로 비교한다.
  trade_date  timestamptz not null default now(),
  sequence    integer not null default 0, -- 같은 날짜 안에서의 거래 순서 (FIFO 정렬 기준)
  memo        text,
  created_at  timestamptz not null default now(),

  constraint trades_quantity_positive check (quantity > 0),
  constraint trades_price_positive check (price > 0),
  constraint trades_kr_integer_quantity check (market <> 'KR' or quantity = floor(quantity))
);

create index trades_account_id_idx on public.trades (account_id);
create index trades_user_id_trade_date_idx on public.trades (user_id, trade_date desc);

alter table public.trades enable row level security;
create policy "trades: 본인만 접근" on public.trades
  for all to public
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 초과 매도 방지 트리거 trades_prevent_oversell과 함수 trades_oversold_qty는
-- migrations/20261105_01_trades_prevent_oversell.sql 참고 (코드를 두 곳에 두지 않기 위해 여기 옮기지 않음)

-- ── stock_settings ─────────────────────────────────────

create table public.stock_settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  stock_code  text not null,
  stock_name  text not null,
  market      public.market not null,
  memo        text,
  target_rate numeric, -- 목표 수익률 (%)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz default now(),

  constraint stock_settings_user_stock_market_key unique (user_id, stock_code, market)
);

alter table public.stock_settings enable row level security;
create policy "own settings" on public.stock_settings
  for all to public
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

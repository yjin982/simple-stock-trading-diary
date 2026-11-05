-- 초과 매도 방지 트리거
--
-- 클라이언트(FormModal, trades 스토어의 wouldIntroduceOversell)에서만 막던 초과 매도를
-- DB에서도 막는다. API를 직접 호출하거나 클라이언트 검증에 버그가 있어도 잘못된 이력이
-- 저장되지 않게 하기 위함이다.
--
-- 판단 기준은 클라이언트와 같다: 이번 변경으로 해당 종목의 "초과 매도 수량"이 늘어나면 거부한다.
-- 이미 초과 매도가 있는 종목이라도, 더 나빠지지 않는 수정·삭제(예: 잘못된 매도를 지우는 것)는 허용한다.
--
-- 초과 매도 수량 = FIFO에서 잔고가 부족해 매칭하지 못한 매도 수량의 합.
-- 잔고를 0 아래로 내려가지 않게 자르며 걸어갈 때 잘린 양의 합은
-- max(0, -(누적 수량의 최솟값))과 같으므로, 거래 순서대로 (매수 +, 매도 -) 누적합을 구해 계산한다.
-- 거래 순서는 클라이언트 sortTradesAsc와 같다: trade_date → sequence → created_at (→ id).
--
-- 실행: Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 안전하다.

create or replace function public.trades_oversold_qty(
  p_user_id    public.trades.user_id%type,
  p_account_id public.trades.account_id%type,
  p_market     public.trades.market%type,
  p_stock_code public.trades.stock_code%type,
  p_exclude_id public.trades.id%type default null, -- 계산에서 뺄 거래 (수정 전/삭제할 행)
  p_extra      public.trades default null           -- 계산에 더할 거래 (추가할/수정 후 행)
)
returns numeric
language sql
stable
set search_path = public
as $$
  with candidate as (
    select t.*
    from trades t
    where t.user_id = p_user_id
      and t.account_id = p_account_id
      and t.market = p_market
      and t.stock_code = p_stock_code
      and (p_exclude_id is null or t.id <> p_exclude_id)
    union all
    select (p_extra).*
    where (p_extra).id is not null
      and (p_extra).user_id = p_user_id
      and (p_extra).account_id = p_account_id
      and (p_extra).market = p_market
      and (p_extra).stock_code = p_stock_code
  ),
  running as (
    select sum(case when type = 'BUY' then quantity else -quantity end)
             over (order by trade_date::date, sequence, created_at, id) as balance
    from candidate
  )
  select greatest(0, -coalesce(min(balance), 0)) from running;
$$;

create or replace function public.trades_prevent_oversell()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  qty_epsilon constant numeric := 0.000000001; -- calc.ts의 QTY_EPSILON과 같은 값
  v_before numeric;
  v_after  numeric;
begin
  -- 새 값(NEW)이 속한 종목: 추가되거나 수정된 뒤의 이력을 검사
  if tg_op in ('INSERT', 'UPDATE') then
    v_before := trades_oversold_qty(new.user_id, new.account_id, new.market, new.stock_code);
    v_after := trades_oversold_qty(
      new.user_id, new.account_id, new.market, new.stock_code,
      case when tg_op = 'UPDATE' then old.id end,
      new
    );
    if v_after > v_before + qty_epsilon then
      raise exception '이 거래를 저장하면 % 종목의 매도 수량이 보유수량을 초과합니다. 거래일·순서·수량을 확인해주세요.', new.stock_name
        using errcode = 'P0001';
    end if;
  end if;

  -- 원래 값(OLD)이 속한 종목: 삭제되거나 다른 종목·계좌로 옮겨진 뒤 남은 이력을 검사
  if tg_op = 'DELETE'
     or (tg_op = 'UPDATE'
         and (old.user_id, old.account_id, old.market, old.stock_code)
             is distinct from (new.user_id, new.account_id, new.market, new.stock_code)) then
    v_before := trades_oversold_qty(old.user_id, old.account_id, old.market, old.stock_code);
    v_after := trades_oversold_qty(old.user_id, old.account_id, old.market, old.stock_code, old.id);
    if v_after > v_before + qty_epsilon then
      raise exception '이 매수를 % 이후 매도 내역이 보유수량을 초과하게 됩니다. 관련 매도 내역을 먼저 확인해주세요.',
        case when tg_op = 'DELETE' then '삭제하면' else '수정하면' end
        using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trades_prevent_oversell on public.trades;
create trigger trades_prevent_oversell
  before insert or update or delete on public.trades
  for each row execute function public.trades_prevent_oversell();

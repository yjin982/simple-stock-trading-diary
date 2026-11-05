-- 초과 매도 방지 트리거에 종목별 잠금 추가
--
-- 01의 트리거는 저장 직전의 커밋된 데이터만 보고 판단한다. 같은 종목에 대한 저장이
-- 거의 동시에 들어오면(예: 보유 10주에서 두 탭이 동시에 각각 10주 매도) 서로의 저장을
-- 보지 못한 채 둘 다 통과할 수 있었다.
--
-- 검사 전에 (사용자, 계좌, 시장, 종목코드)별 advisory lock을 잡아 같은 종목의 저장을
-- 한 번에 하나씩 처리한다. 뒤에 온 저장은 앞의 트랜잭션이 끝날 때까지 기다리고,
-- 잠금을 얻은 뒤의 검사 쿼리는 새 스냅샷(READ COMMITTED)으로 앞의 저장을 보고 판단한다.
-- 잠금은 트랜잭션이 끝나면 자동으로 풀린다. 다른 종목끼리는 서로 기다리지 않는다
-- (해시가 우연히 겹치면 잠시 기다릴 뿐, 결과는 같다).
--
-- 실행: Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 안전하다.
-- 트리거(trades_prevent_oversell)는 그대로 두고 함수 본문만 바꾼다.

create or replace function public.trades_prevent_oversell()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  qty_epsilon constant numeric := 0.000000001; -- calc.ts의 QTY_EPSILON과 같은 값
  v_before   numeric;
  v_after    numeric;
  v_new_lock bigint;
  v_old_lock bigint;
begin
  -- 같은 종목에 대한 동시 저장을 순서대로 처리하기 위한 잠금
  if tg_op in ('INSERT', 'UPDATE') then
    v_new_lock := hashtextextended(concat_ws('|', new.user_id, new.account_id, new.market, new.stock_code), 0);
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    v_old_lock := hashtextextended(concat_ws('|', old.user_id, old.account_id, old.market, old.stock_code), 0);
  end if;

  if v_new_lock is not null and v_old_lock is not null and v_new_lock <> v_old_lock then
    -- 종목을 옮기는 수정은 두 종목을 잠근다. 항상 작은 값부터 잠가 교착 상태를 피한다.
    perform pg_advisory_xact_lock(least(v_new_lock, v_old_lock));
    perform pg_advisory_xact_lock(greatest(v_new_lock, v_old_lock));
  else
    perform pg_advisory_xact_lock(coalesce(v_new_lock, v_old_lock));
  end if;

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

-- 데이터 제약·기본값 정리
--
-- inspect_schema.sql로 실제 DB를 조회해 발견한 문제를 고친다.
-- 실행 전 확인: 아래 제약에 걸리는 기존 데이터가 0건임을 확인했다 (2026-11-05).
--
-- 실행: Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여 넣고 Run.
-- 전체가 한 트랜잭션이라 중간에 실패하면 아무것도 바뀌지 않는다. 여러 번 실행해도 안전하다.

begin;

-- 1) 계좌 통화에 BOTH(KRW+USD) 허용
--    앱은 계좌 통화로 BOTH를 쓰지만 DB의 currency enum은 KRW, USD뿐이라 BOTH 계좌를 만들 수 없었다.
--    currency enum은 trades.currency도 쓰므로 거기에 BOTH를 추가하지 않고 계좌 전용 enum을 둔다.
do $$
begin
  create type public.account_currency as enum ('KRW', 'USD', 'BOTH');
exception
  when duplicate_object then null;
end $$;

alter table public.accounts alter column currency drop default;
alter table public.accounts
  alter column currency type public.account_currency using currency::text::public.account_currency;
alter table public.accounts alter column currency set default 'KRW';

-- 2) 수량·단가는 양수만 허용
--    음수 수량의 "매도"는 잔고를 늘려 초과 매도 방지 트리거를 우회할 수 있다.
alter table public.trades drop constraint if exists trades_quantity_positive;
alter table public.trades add constraint trades_quantity_positive check (quantity > 0);
alter table public.trades drop constraint if exists trades_price_positive;
alter table public.trades add constraint trades_price_positive check (price > 0);

-- 3) 국내 주식은 정수 수량만 허용 (앱의 수량 정책과 같음, 미국 주식은 소수 허용)
alter table public.trades drop constraint if exists trades_kr_integer_quantity;
alter table public.trades add constraint trades_kr_integer_quantity
  check (market <> 'KR' or quantity = floor(quantity));

-- 4) 의미 없는 기본값 정리
--    user_id·account_id·broker_name의 기본값이 gen_random_uuid()로 되어 있었다.
--    user_id는 로그인 사용자로, 나머지는 기본값 없이 항상 앱이 넣도록 한다.
alter table public.accounts alter column user_id set default auth.uid();
alter table public.trades alter column user_id set default auth.uid();
alter table public.accounts alter column broker_name drop default;
alter table public.trades alter column account_id drop default;

-- 5) 계좌 별칭은 필수 (앱 타입·입력 폼과 맞춤, 기존 null 0건)
alter table public.accounts alter column alias set not null;

commit;

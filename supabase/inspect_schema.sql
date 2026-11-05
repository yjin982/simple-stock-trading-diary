-- 현재 Supabase DB의 public 스키마 상태를 한 표로 조회한다 (읽기 전용).
-- Supabase SQL 에디터는 마지막 결과만 보여 주므로 UNION ALL로 하나의 결과로 합쳤다.
-- 결과는 supabase/schema.sql을 실제 DB와 맞출 때 사용한다.

select '1_column' as kind,
       (table_name || '.' || column_name)::text as name,
       (case when data_type = 'USER-DEFINED' then udt_name else data_type end
         || case when is_nullable = 'NO' then ' NOT NULL' else '' end
         || coalesce(' DEFAULT ' || column_default, ''))::text as definition
from information_schema.columns
where table_schema = 'public'

union all
select '2_constraint',
       conrelid::regclass::text || '.' || conname,
       pg_get_constraintdef(oid)
from pg_constraint
where connamespace = 'public'::regnamespace and conrelid <> 0

union all
select '3_rls',
       relname::text,
       case when relrowsecurity then 'RLS ON' else 'RLS OFF' end
         || case when relforcerowsecurity then ' (FORCE)' else '' end
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'

union all
select '4_policy',
       tablename || '.' || policyname,
       cmd || ' TO ' || array_to_string(roles, ',')
         || ' USING (' || coalesce(qual, '') || ')'
         || ' WITH CHECK (' || coalesce(with_check, '') || ')'
from pg_policies
where schemaname = 'public'

union all
select '5_index', tablename || '.' || indexname, indexdef
from pg_indexes
where schemaname = 'public'

union all
select '6_trigger',
       (event_object_table || '.' || trigger_name)::text,
       (action_timing || ' ' || event_manipulation || ' ' || action_statement)::text
from information_schema.triggers
where trigger_schema = 'public'

union all
select '7_function', p.proname::text, pg_get_function_identity_arguments(p.oid)
from pg_proc p
where p.pronamespace = 'public'::regnamespace

union all
select '8_enum', t.typname::text, string_agg(e.enumlabel, ', ' order by e.enumsortorder)
from pg_type t
join pg_enum e on e.enumtypid = t.oid
where t.typnamespace = 'public'::regnamespace
group by t.typname

order by 1, 2;

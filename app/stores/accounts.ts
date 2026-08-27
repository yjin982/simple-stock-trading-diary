import type { Account } from '~/types'

type AccountRow = {
  id: string
  user_id: string
  broker_name: string
  alias: string | null
  account_number: string | null
  currency: 'KRW' | 'USD' | 'BOTH'
  created_at: string
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    userId: row.user_id,
    brokerName: row.broker_name,
    alias: row.alias ?? '',
    accountNumber: row.account_number ?? undefined,
    currency: row.currency,
    createdAt: row.created_at,
  }
}

export const useAccountsStore = defineStore('accounts', () => {
  const client = useSupabaseClient()

  const items = ref<Account[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null

    const { data, error: err } = await client
      .from('accounts')
      .select('*')
      .order('created_at')

    if (err) error.value = err.message
    else items.value = (data as AccountRow[]).map(mapAccount)

    loading.value = false
  }

  async function add(payload: {
    brokerName: string
    alias: string
    accountNumber?: string
    currency: 'KRW' | 'USD' | 'BOTH'
  }): Promise<Account | null> {
    error.value = null
    loading.value = true
    try {
      const { data: { session } } = await client.auth.getSession()
      if (!session) { error.value = '로그인이 필요합니다.'; return null }

      const { data, error: err } = await client
        .from('accounts')
        .insert({
          user_id: session.user.id,
          broker_name: payload.brokerName,
          alias: payload.alias,
          account_number: payload.accountNumber || null,
          currency: payload.currency,
        })
        .select()
        .single()

      if (err) { error.value = err.message; return null }

      const account = mapAccount(data as AccountRow)
      items.value.push(account)
      return account
    } finally {
      loading.value = false
    }
  }

  async function update(
    id: string,
    payload: {
      brokerName?: string
      alias?: string
      accountNumber?: string
      currency?: 'KRW' | 'USD' | 'BOTH'
    },
  ): Promise<Account | null> {
    error.value = null
    loading.value = true
    try {
      const { data, error: err } = await client
        .from('accounts')
        .update({
          ...(payload.brokerName !== undefined && { broker_name: payload.brokerName }),
          ...(payload.alias !== undefined && { alias: payload.alias }),
          ...(payload.accountNumber !== undefined && { account_number: payload.accountNumber || null }),
          ...(payload.currency !== undefined && { currency: payload.currency }),
        })
        .eq('id', id)
        .select()
        .single()

      if (err) { error.value = err.message; return null }

      const account = mapAccount(data as AccountRow)
      const idx = items.value.findIndex(a => a.id === id)
      if (idx !== -1) items.value[idx] = account
      return account
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    error.value = null
    loading.value = true
    try {
      const { error: err } = await client
        .from('accounts')
        .delete()
        .eq('id', id)

      if (err) error.value = err.message
      else items.value = items.value.filter(a => a.id !== id)
    } finally {
      loading.value = false
    }
  }

  function clearError() { error.value = null }

  function getBrokerUrl(accountId: string): string {
    const account = items.value.find(a => a.id === accountId)
    return account?.brokerName
      ? `/accounts/${encodeURIComponent(account.brokerName)}`
      : '/accounts'
  }

  return { items, loading, error, fetchAll, add, update, remove, clearError, getBrokerUrl }
})

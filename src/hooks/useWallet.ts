'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, Wallet } from '@/types/database'
import { useAuth } from './useAuth'

interface UseWalletReturn {
  balance: number
  transactions: Transaction[]
  loading: boolean
  refresh: () => Promise<void>
}

export function useWallet(): UseWalletReturn {
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setBalance(0)
      setTransactions([])
      setLoading(false)
      return
    }

    const supabase = createClient()

    const [walletRes, txRes] = await Promise.all([
      supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single<Wallet>(),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (walletRes.data) setBalance(Number(walletRes.data.balance))
    if (txRes.data) setTransactions(txRes.data as Transaction[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchWallet()

    const supabase = createClient()

    // Suscripción Realtime: actualizar balance cuando cambia la wallet
    const channel = supabase
      .channel(`wallet:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof (payload.new as Wallet).balance === 'number') {
            setBalance(Number((payload.new as Wallet).balance))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchWallet])

  return { balance, transactions, loading, refresh: fetchWallet }
}

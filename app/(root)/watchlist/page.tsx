import React from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth/auth'
import { getWatchlistByEmail } from '@/lib/actions/watchlist.actions'
import WatchlistTable from '@/components/WatchlistTable'

export default async function Watchlist() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Please sign in to view your watchlist</p>
      </div>
    )
  }

  const watchlist = await getWatchlistByEmail(session.user.email)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-gray-500 mt-2">
          {watchlist.length === 0
            ? 'No stocks in your watchlist yet'
            : `You are tracking ${watchlist.length} stock${watchlist.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {watchlist.length > 0 ? (
        <div className="rounded-lg ">
          <WatchlistTable />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Start tracking stocks to build your watchlist</p>
        </div>
      )}
    </div>
  )
}
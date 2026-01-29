'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth/auth';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

interface FinnhubQuote {
  c?: number; // current price
  dp?: number; // percent change
  marketCapitalization?: number;
}

interface FinnhubProfile {
  name?: string;
  pe?: number;
  marketCapitalization?: number;
}

const fetchStockQuote = async (symbol: string): Promise<FinnhubQuote | null> => {
  try {
    if (!FINNHUB_API_KEY) return null;
    
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 300 }, // 5 minutes
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

const fetchStockProfile = async (symbol: string): Promise<FinnhubProfile | null> => {
  try {
    if (!FINNHUB_API_KEY) return null;

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // 1 hour
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
};

const formatPrice = (price?: number): string => {
  if (price === undefined || price === null) return '—';
  return `$${price.toFixed(2)}`;
};

const formatChange = (change?: number): string => {
  if (change === undefined || change === null) return '—';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

const formatMarketCap = (cap?: number): string => {
  if (cap === undefined || cap === null) return '—';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toFixed(0)}`;
};

const formatPERatio = (pe?: number): string => {
  if (pe === undefined || pe === null) return '—';
  return pe.toFixed(2);
};

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    await connectToDatabase();

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection failed');
      return [];
    }

    // Find user by email
    const user = await db.collection('user').findOne(
      { email },
      { projection: { id: 1, _id: 1 } }
    );

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    const userId = user.id || user._id?.toString();
    if (!userId) {
      console.error('User ID not found');
      return [];
    }

    // Query watchlist by userId and return symbols
    const watchlistItems = await Watchlist.find({ userId })
      .select('symbol')
      .lean()
      .exec();

    if (!watchlistItems || watchlistItems.length === 0) {
      return [];
    }

    return watchlistItems
      .map((item) => item.symbol)
      .filter((symbol): symbol is string => Boolean(symbol));
  } catch (error) {
    console.error('Error fetching watchlist symbols:', error);
    return [];
  }
};

export const getWatchlistByEmail = async (email: string): Promise<StockWithData[]> => {
  try {
    await connectToDatabase();

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection failed');
      return [];
    }

    // Find user by email
    const user = await db.collection('user').findOne(
      { email },
      { projection: { id: 1, _id: 1 } }
    );

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    const userId = user.id || user._id?.toString();
    if (!userId) {
      console.error('User ID not found');
      return [];
    }

    // Query watchlist by userId
    const watchlistItems = await Watchlist.find({ userId })
      .lean()
      .exec();

    if (!watchlistItems || watchlistItems.length === 0) {
      return [];
    }

    // Fetch stock data for each item in parallel
    const stockDataPromises = watchlistItems.map(async (item) => {
      const [quote, profile] = await Promise.all([
        fetchStockQuote(item.symbol || ''),
        fetchStockProfile(item.symbol || ''),
      ]);

      return {
        userId: item.userId || '',
        symbol: item.symbol || '',
        company: item.company || '',
        addedAt: item.addedAt || new Date(),
        currentPrice: quote?.c,
        changePercent: quote?.dp,
        priceFormatted: formatPrice(quote?.c),
        changeFormatted: formatChange(quote?.dp),
        marketCap: formatMarketCap(quote?.marketCapitalization || profile?.marketCapitalization),
        peRatio: formatPERatio(profile?.pe),
      };
    });

    return Promise.all(stockDataPromises);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
};

export const addToWatchlist = async (
  symbol: string,
  company: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    await connectToDatabase();

    const watchlistItem = new Watchlist({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      company: company.toUpperCase(),
      addedAt: new Date(),
    });

    await watchlistItem.save();

    return { success: true, message: `${symbol} added to watchlist` };
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate')) {
      return { success: false, message: `${symbol} is already in your watchlist` };
    }
    console.error('Error adding to watchlist:', error);
    return { success: false, message: 'Failed to add to watchlist' };
  }
};

export const removeFromWatchlist = async (
  symbol: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    await connectToDatabase();

    const result = await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      return { success: false, message: `${symbol} not found in watchlist` };
    }

    return { success: true, message: `${symbol} removed from watchlist` };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { success: false, message: 'Failed to remove from watchlist' };
  }
};

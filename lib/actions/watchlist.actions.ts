'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';
import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth/auth';

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

    // Map to StockWithData (without live data for now)
    return watchlistItems.map((item) => ({
      userId: item.userId || '',
      symbol: item.symbol || '',
      company: item.company || '',
      addedAt: item.addedAt || new Date(),
      currentPrice: undefined,
      changePercent: undefined,
      priceFormatted: '—',
      changeFormatted: '—',
      marketCap: '—',
      peRatio: '—',
    }));
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

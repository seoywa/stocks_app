'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';

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

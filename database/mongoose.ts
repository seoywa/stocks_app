import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null
  }
}

let cached = global.mongooseCache;
// USE THIS GLOBAL HASH SO HOT RELOAD IN DEVELOPMENT DOESN'T RESULT IN MAKING A NEW CONNECTION WHENEVER WE MAKE A NEW REQUEST. RATHER IT WILL TAKE THE SAME OLD CONNECTION FROM THE CACHE

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null }
}
// IF THERE'S NO CONNECTION IN THE FIRST PLACE, AKA NO CACHE, SET CACHED TO AN EMPTY CONNECTION AND EMPTY PROMISE

export const connectToDatabase = async () => {
  if (!MONGODB_URI) throw new Error('A MONGODB_URI must be set within .env file');

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  try {
    cached.conn = await cached.promise;

  } catch (err) {
    cached.promise = null;
    throw err
  }

  console.log(`Connected to database: ${process.env.NODE_ENV} mode - ${MONGODB_URI}`);

  return cached.conn;
}
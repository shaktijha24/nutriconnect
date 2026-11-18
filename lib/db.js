import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models';

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (!existing) {
    await User.create({
      name: 'Administrator',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
    });
    console.log(`[NutriConnect] Admin account created for ${email}`);
  }
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to your environment variables.');
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { bufferCommands: false })
      .then(async (m) => {
        await ensureAdmin();
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

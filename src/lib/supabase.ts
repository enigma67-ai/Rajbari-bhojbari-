/**
 * ==============================================================================
 * ⚡ SUPABASE DATABASE & AUTHENTICATION CLIENT
 * ==============================================================================
 * 
 * 🔑 PASTE_YOUR_API_KEYS_HERE:
 * Replace the placeholder values below or configure them in your .env / .env.local:
 *   VITE_SUPABASE_URL="https://PASTE_YOUR_SUPABASE_PROJECT_URL_HERE.supabase.co"
 *   VITE_SUPABASE_ANON_KEY="PASTE_YOUR_SUPABASE_ANON_API_KEY_HERE"
 *
 * ------------------------------------------------------------------------------
 * 📋 RECOMMENDED SUPABASE SQL SCHEMA (Paste this into Supabase SQL Editor):
 * ------------------------------------------------------------------------------
 * ```sql
 * -- 1. Users Table
 * create table if not exists public.users (
 *   id text primary key,
 *   name text not null,
 *   email text,
 *   phone text,
 *   email_or_phone text,
 *   role text default 'guest',
 *   institution text default 'IAM Kolkata',
 *   sustainability_karma integer default 100,
 *   tokens text[] default array[]::text[],
 *   last_login_at timestamp with time zone default timezone('utc'::text, now()),
 *   created_at timestamp with time zone default timezone('utc'::text, now()),
 *   updated_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- 2. Bookings Table (Purchases, Passes, and Food Reservations)
 * create table if not exists public.bookings (
 *   id uuid default gen_random_uuid() primary key,
 *   booking_id text not null unique,
 *   user_id text not null,
 *   customer_name text not null,
 *   customer_email text not null,
 *   customer_phone text,
 *   total_amount numeric(10, 2) not null default 0,
 *   payment_method text not null default 'upi',
 *   payment_status text not null default 'paid',
 *   dining_slot text default 'General Festival Admission',
 *   event_date text default 'Friday, 9th October 2026',
 *   pass_quantity integer default 1,
 *   items jsonb default '[]'::jsonb,
 *   welcome_drink text,
 *   starter_dish text,
 *   mains_dish text,
 *   dessert_dish text,
 *   include_dessert boolean default false,
 *   qr_code_url text,
 *   transaction_id text,
 *   razorpay_payment_id text,
 *   gate_location text default 'Main Green Gate 1',
 *   created_at timestamp with time zone default timezone('utc'::text, now()),
 *   updated_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- 3. User Logins Table (Audit & Login History)
 * create table if not exists public.user_logins (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id text not null,
 *   name text,
 *   email_or_phone text,
 *   login_method text default 'otp',
 *   user_agent text,
 *   ip_address text,
 *   logged_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- 4. Visitor Analytics Table
 * create table if not exists public.visitor_analytics (
 *   id uuid default gen_random_uuid() primary key,
 *   session_id text,
 *   event_type text not null,
 *   page_path text default '/',
 *   referrer text,
 *   metadata jsonb default '{}'::jsonb,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Optional views for backwards compatibility with legacy profiles/purchase_history queries:
 * create or replace view public.profiles as select * from public.users;
 * create or replace view public.purchase_history as select * from public.bookings;
 * ```
 * ==============================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==============================================================================
// 🔑 SUPABASE CONFIGURATION
// ==============================================================================
const rawUrl = (typeof import.meta.env.VITE_SUPABASE_URL === 'string' ? import.meta.env.VITE_SUPABASE_URL : '').trim().replace(/\.$/, '');
const supabaseUrl = rawUrl || 'https://rrvjsyppggtthqfxvquq.supabase.co';

const rawKey = (typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' ? import.meta.env.VITE_SUPABASE_ANON_KEY : '').trim();
const supabaseAnonKey = rawKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydmpzeXBwZ2d0dGhxZnh2cXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.mock_key';

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

// Check if developer has replaced default placeholders
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('PASTE_YOUR') &&
    !supabaseAnonKey.includes('PASTE_YOUR') &&
    supabaseUrl.startsWith('http')
  );
};

// Safe Singleton Supabase Client with local storage session persistence and PKCE flow
function createSafeSupabaseClient(): SupabaseClient {
  try {
    return createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
  } catch (err) {
    console.warn('Safe Supabase client creation fallback:', err);
    return createClient(
      'https://rrvjsyppggtthqfxvquq.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydmpzeXBwZ2d0dGhxZnh2cXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.mock_key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    );
  }
}

export const supabase: SupabaseClient = createSafeSupabaseClient();

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return supabase;
}

// ==============================================================================
// 1. USER LOGIN TRACKING
// ==============================================================================
export interface UserLoginRecord {
  id: string; // User ID
  name: string;
  emailOrPhone: string;
  role?: string;
  institution?: string;
  sustainabilityKarma?: number;
  loginMethod?: 'otp' | 'google' | 'supabase_auth' | 'guest';
}

/**
 * Securely records user login into Supabase:
 * - Upserts user profile in the `profiles` table
 * - Appends audit event into `user_logins` table
 */
export async function recordUserLoginToSupabase(
  user: UserLoginRecord,
  loginMethod: 'otp' | 'google' | 'supabase_auth' | 'guest' = 'otp'
): Promise<{ success: boolean; mode: 'supabase' | 'simulation'; error?: string }> {
  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  // If Supabase credentials are not configured yet, record in local storage audit log
  if (!client) {
    try {
      const localLogins = JSON.parse(localStorage.getItem('rb_supabase_logins_audit') || '[]');
      localLogins.unshift({
        user_id: user.id,
        name: user.name,
        email_or_phone: user.emailOrPhone,
        login_method: loginMethod,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        logged_at: timestamp,
      });
      localStorage.setItem('rb_supabase_logins_audit', JSON.stringify(localLogins.slice(0, 50)));
    } catch (_) {}

    console.info(
      `[Supabase Auth Simulation] User logged in: ${user.name} (${user.emailOrPhone}, ID: ${user.id}). Configure VITE_SUPABASE_URL to persist to remote table 'user_logins'.`
    );
    return { success: true, mode: 'simulation' };
  }

  try {
    // 1. Upsert into 'users' table
    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.emailOrPhone?.includes('@') ? user.emailOrPhone : '',
      phone: !user.emailOrPhone?.includes('@') ? user.emailOrPhone : '',
      email_or_phone: user.emailOrPhone,
      role: user.role || 'guest',
      institution: user.institution || 'IAM Kolkata',
      sustainability_karma: user.sustainabilityKarma || 100,
      last_login_at: timestamp,
      updated_at: timestamp,
    };

    const { error: userError } = await client
      .from('users')
      .upsert(userPayload, { onConflict: 'id' });

    if (userError) {
      // Fallback attempt to 'profiles' table for backwards compatibility
      const { error: profileError } = await client
        .from('profiles')
        .upsert({
          id: user.id,
          name: user.name,
          email_or_phone: user.emailOrPhone,
          role: user.role || 'guest',
          institution: user.institution || '',
          sustainability_karma: user.sustainabilityKarma || 100,
          last_login_at: timestamp,
          updated_at: timestamp,
        }, { onConflict: 'id' });
      if (profileError) {
        console.warn('Supabase user profile sync notice:', profileError.message);
      }
    }

    // 2. Insert Login Audit Record
    const { error: loginError } = await client
      .from('user_logins')
      .insert({
        user_id: user.id,
        name: user.name,
        email_or_phone: user.emailOrPhone,
        login_method: loginMethod,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        logged_at: timestamp,
      });

    if (loginError) {
      console.warn('Supabase user_logins insert notice:', loginError.message);
    }

    return { success: true, mode: 'supabase' };
  } catch (err: any) {
    console.error('Error recording user login to Supabase:', err);
    return { success: false, mode: 'supabase', error: err?.message };
  }
}

// ==============================================================================
// 2. PURCHASE & BOOKING HISTORY TRACKING (Tied to Specific User Account)
// ==============================================================================
export interface PurchaseRecordPayload {
  bookingId: string;
  userId: string; // Mandatory: Tied to authenticated user
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  diningSlot?: string;
  eventDate?: string;
  passQuantity?: number;
  items?: any[];
  qrCodeUrl?: string;
  transactionId?: string;
  upiUtr?: string;
}

/**
 * Securely writes a completed purchase or event pass booking to Supabase `bookings` (or `purchase_history`).
 */
export async function recordPurchaseToSupabase(
  purchase: PurchaseRecordPayload
): Promise<{ success: boolean; mode: 'supabase' | 'simulation'; error?: string }> {
  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  // If Supabase is not yet configured, record to local audit store
  if (!client) {
    try {
      const localPurchases = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
      localPurchases.unshift({
        ...purchase,
        created_at: timestamp,
      });
      localStorage.setItem('rb_supabase_purchase_history', JSON.stringify(localPurchases.slice(0, 50)));
    } catch (_) {}

    console.info(
      `[Supabase Purchase Simulation] Stored booking ${purchase.bookingId} for User ${purchase.userId} (${purchase.customerEmail}) of ₹${purchase.totalAmount}. Configure VITE_SUPABASE_URL to persist to table 'bookings'.`
    );
    return { success: true, mode: 'simulation' };
  }

  try {
    const drinkItem = purchase.items?.find((i: any) => i.type === 'drink')?.name || '';
    const starterItem = purchase.items?.find((i: any) => i.type === 'starter')?.name || '';
    const mainsItem = purchase.items?.find((i: any) => i.type === 'mains')?.name || '';
    const dessertItem = purchase.items?.find((i: any) => i.type === 'dessert')?.name || '';

    // 1. Primary write to 'bookings' table
    const bookingPayload = {
      booking_id: purchase.bookingId,
      user_id: purchase.userId,
      customer_name: purchase.customerName,
      customer_email: purchase.customerEmail,
      customer_phone: purchase.customerPhone || '',
      total_amount: purchase.totalAmount,
      payment_method: purchase.paymentMethod,
      payment_status: purchase.paymentStatus,
      dining_slot: purchase.diningSlot || 'General Festival Admission',
      event_date: purchase.eventDate || 'Friday, 9th October 2026',
      pass_quantity: purchase.passQuantity || 1,
      items: purchase.items || [],
      welcome_drink: drinkItem,
      starter_dish: starterItem,
      mains_dish: mainsItem,
      dessert_dish: dessertItem,
      include_dessert: Boolean(dessertItem),
      qr_code_url: purchase.qrCodeUrl || '',
      transaction_id: purchase.transactionId || '',
      upi_utr: purchase.upiUtr || null,
      created_at: timestamp,
    };

    const { error: bookingError } = await client
      .from('bookings')
      .upsert(bookingPayload, { onConflict: 'booking_id' });

    if (bookingError) {
      // Fallback attempt to legacy 'purchase_history' table
      const { error: historyError } = await client
        .from('purchase_history')
        .upsert({
          booking_id: purchase.bookingId,
          user_id: purchase.userId,
          customer_name: purchase.customerName,
          customer_email: purchase.customerEmail,
          customer_phone: purchase.customerPhone || '',
          total_amount: purchase.totalAmount,
          payment_method: purchase.paymentMethod,
          payment_status: purchase.paymentStatus,
          dining_slot: purchase.diningSlot || 'General Festival Admission',
          event_date: purchase.eventDate || 'Friday, 9th October 2026',
          pass_quantity: purchase.passQuantity || 1,
          items: purchase.items || [],
          qr_code_url: purchase.qrCodeUrl || '',
          transaction_id: purchase.transactionId || '',
          upi_utr: purchase.upiUtr || null,
          created_at: timestamp,
        }, { onConflict: 'booking_id' });

      if (historyError) {
        console.warn('Supabase bookings insert notice:', bookingError.message);
        return { success: false, mode: 'supabase', error: bookingError.message };
      }
    }

    console.log(`[Supabase] Successfully persisted purchase ${purchase.bookingId} for user ${purchase.userId}`);
    return { success: true, mode: 'supabase' };
  } catch (err: any) {
    console.error('Error saving purchase to Supabase:', err);
    return { success: false, mode: 'supabase', error: err?.message };
  }
}

/**
 * Retrieves the purchase history for a specific user from Supabase.
 */
export async function fetchUserPurchaseHistoryFromSupabase(
  userId: string
): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) {
    try {
      const local = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
      return local.filter((item: any) => item.userId === userId || item.user_id === userId);
    } catch {
      return [];
    }
  }

  try {
    const { data: bookingData, error: bookingErr } = await client
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!bookingErr && bookingData && bookingData.length > 0) {
      return bookingData;
    }

    const { data, error } = await client
      .from('purchase_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch purchase history error:', error.message);
      return bookingData || [];
    }
    return data || [];
  } catch (err) {
    console.error('Failed to query Supabase purchase history:', err);
    return [];
  }
}

// ==============================================================================
// 3. VISITOR ANALYTICS TRACKING
// ==============================================================================
let _sessionId: string | null = null;
export function getOrCreateSessionId(): string {
  if (_sessionId) return _sessionId;
  try {
    let s = sessionStorage.getItem('rb_session_id');
    if (!s) {
      s = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      sessionStorage.setItem('rb_session_id', s);
    }
    _sessionId = s;
    return s;
  } catch {
    return 'sess_fallback_' + Date.now();
  }
}

/**
 * Records a visitor analytics event in Supabase `visitor_analytics`.
 * Also correlates with Microsoft Clarity tags if available in window.
 */
export async function recordVisitorAnalyticsToSupabase(
  eventType: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const client = getSupabaseClient();
  const sessionId = getOrCreateSessionId();
  const pagePath = typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/';
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  // Forward event to Microsoft Clarity if initialized
  if (typeof window !== 'undefined' && (window as any).clarity) {
    try {
      (window as any).clarity('event', eventType);
      if (metadata.userId) {
        (window as any).clarity('set', 'userId', metadata.userId);
      }
    } catch (_) {}
  }

  if (!client) {
    return;
  }

  try {
    await client.from('visitor_analytics').insert({
      session_id: sessionId,
      event_type: eventType,
      page_path: pagePath,
      referrer,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Silently handle analytics non-critical issues
    console.debug('Visitor analytics dispatch notice:', err);
  }
}

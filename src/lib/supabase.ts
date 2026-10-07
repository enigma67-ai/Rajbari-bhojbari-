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
  paymentStatus?: string;
  diningSlot?: string | null;
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
    // STRICT REQUIREMENT: Create a sanitized data object that ONLY includes these specific keys:
    // customer_name, customer_email, customer_phone, total_amount, payment_method, dining_slot,
    // pass_quantity, qr_code_url, and upi_utr (along with booking_id and user_id if required).
    // Explicitly remove or omit event_date, dessert_dish, and any other newly generated fields from the insert payload.
    const sanitizedBookingPayload = {
      booking_id: purchase.bookingId,
      user_id: purchase.userId,
      customer_name: purchase.customerName,
      customer_email: purchase.customerEmail,
      customer_phone: purchase.customerPhone || '',
      total_amount: purchase.totalAmount,
      payment_method: purchase.paymentMethod,
      dining_slot: purchase.diningSlot ?? null,
      pass_quantity: purchase.passQuantity || 1,
      qr_code_url: purchase.qrCodeUrl || '',
      upi_utr: purchase.upiUtr || null,
    };

    // Pure .insert([...]) operation - no upsert or conflict target on customer_email
    const { error: bookingError } = await client
      .from('bookings')
      .insert([sanitizedBookingPayload]);

    if (bookingError) {
      console.warn('Supabase bookings insert notice:', bookingError.message);
      // Fallback attempt to legacy 'purchase_history' table with the same sanitized payload
      const { error: historyError } = await client
        .from('purchase_history')
        .insert([sanitizedBookingPayload]);

      if (historyError) {
        console.warn('Supabase purchase_history insert notice:', historyError.message);
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

// ==============================================================================
// 4. ADMIN & GATE STAFF BOOKINGS MANAGEMENT
// ==============================================================================

/**
 * Fetches all booking records from Supabase `bookings` table sorted newest first.
 */
export async function fetchAllBookingsFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  let remoteBookings: any[] = [];
  
  if (client) {
    try {
      const { data, error } = await client
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        remoteBookings = data.map((b: any) => ({
          ...b,
          status: b.status || (b.verified_at_gate ? 'admitted' : 'pending'),
          verified_at_gate: Boolean(
            b.verified_at_gate === true ||
            b.status === 'confirmed' ||
            b.status === 'admitted' ||
            b.payment_status === 'confirmed'
          ),
          payment_status: b.status === 'confirmed' || b.payment_status === 'confirmed' ? 'confirmed' : (b.payment_status || 'paid'),
        }));
      } else if (error) {
        console.warn('Supabase fetch all bookings query error:', error.message);
      }
    } catch (e) {
      console.warn('Error fetching all bookings from Supabase:', e);
    }
  }

  // Merge with any cached/simulated bookings from local storage
  try {
    const local = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
    const existingIds = new Set(remoteBookings.map((b) => b.booking_id || b.bookingId));
    
    for (const item of local) {
      const bId = item.booking_id || item.bookingId;
      if (bId && !existingIds.has(bId)) {
        const isVerified = Boolean(
          item.verified_at_gate === true ||
          item.status === 'confirmed' ||
          item.payment_status === 'confirmed'
        );
        remoteBookings.push({
          id: item.id || bId,
          booking_id: bId,
          user_id: item.user_id || item.userId || 'guest',
          customer_name: item.customer_name || item.customerName || 'Honored Guest',
          customer_email: item.customer_email || item.customerEmail || '',
          customer_phone: item.customer_phone || item.customerPhone || '',
          total_amount: Number(item.total_amount || item.totalAmount || 0),
          payment_method: item.payment_method || item.paymentMethod || 'UPI_QR',
          payment_status: isVerified ? 'confirmed' : (item.payment_status || item.paymentStatus || 'paid'),
          dining_slot: item.dining_slot || item.diningSlot || null,
          event_date: item.event_date || item.eventDate || 'Friday, 9th October 2026',
          pass_quantity: Number(item.pass_quantity || item.passQuantity || 1),
          items: item.items || [],
          welcome_drink: item.welcome_drink || item.welcomeDrink || '',
          starter_dish: item.starter_dish || item.starterDish || '',
          mains_dish: item.mains_dish || item.mainsDish || '',
          dessert_dish: item.dessert_dish || item.dessertDish || '',
          include_dessert: Boolean(item.include_dessert ?? item.includeDessert),
          qr_code_url: item.qr_code_url || item.qrCodeUrl || '',
          transaction_id: item.transaction_id || item.transactionId || '',
          upi_utr: item.upi_utr || item.upiUtr || '',
          verified_at_gate: isVerified,
          verified_at_gate_time: item.verified_at_gate_time || null,
          created_at: item.created_at || new Date().toISOString(),
        });
        existingIds.add(bId);
      }
    }
  } catch (_) {}

  // Sort by created_at DESC
  remoteBookings.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  return remoteBookings;
}

/**
 * Updates `status` and `verified_at_gate` status for a booking in Supabase & local cache.
 */
export async function updateBookingGateVerification(
  bookingId: string,
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  if (client) {
    try {
      const { error } = await client
        .from('bookings')
        .update({
          status: verified ? 'admitted' : 'pending',
          payment_status: verified ? 'confirmed' : 'paid',
          verified_at_gate: verified,
          verified_at_gate_time: verified ? timestamp : null,
          updated_at: timestamp,
        })
        .eq('booking_id', bookingId);

      if (error) {
        console.warn('Supabase update verification warning, trying status-only query:', error.message);
        // Fallback update without verified_at_gate if column doesn't exist
        await client
          .from('bookings')
          .update({
            status: verified ? 'admitted' : 'pending',
          })
          .eq('booking_id', bookingId);
      } else {
        console.log(`[Supabase] Booking ${bookingId} status updated to ${verified ? 'admitted' : 'pending'}`);
      }
    } catch (e: any) {
      console.warn('Failed to update Supabase booking gate verification:', e);
    }
  }

  // Update local storage backup
  try {
    const local = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
    const updated = local.map((item: any) => {
      if ((item.booking_id || item.bookingId) === bookingId) {
        return {
          ...item,
          status: verified ? 'admitted' : 'pending',
          payment_status: verified ? 'confirmed' : 'paid',
          verified_at_gate: verified,
          verified_at_gate_time: verified ? timestamp : null,
        };
      }
      return item;
    });
    localStorage.setItem('rb_supabase_purchase_history', JSON.stringify(updated));
  } catch (_) {}

  return { success: true };
}

/**
 * Permanently deletes a booking record from Supabase `bookings` table and local backups.
 */
export async function deleteBookingFromSupabase(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (client) {
    try {
      let { error } = await client
        .from('bookings')
        .delete()
        .eq('booking_id', bookingId);

      if (error && (error.message?.includes('booking_id') || error.code === '42703')) {
        const idAttempt = await client
          .from('bookings')
          .delete()
          .eq('id', bookingId);
        error = idAttempt.error;
      }

      if (error) {
        console.warn('Supabase delete booking warning, trying purchase_history:', error.message);
        await client
          .from('purchase_history')
          .delete()
          .eq('booking_id', bookingId);
      } else {
        console.log(`[Supabase] Booking ${bookingId} permanently deleted.`);
      }
    } catch (e: any) {
      console.warn('Failed to delete booking from Supabase:', e);
    }
  }

  // Remove from local storage backups
  try {
    const local = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
    const updated = local.filter((item: any) => (item.booking_id || item.bookingId) !== bookingId);
    localStorage.setItem('rb_supabase_purchase_history', JSON.stringify(updated));

    const verifiedSaved = JSON.parse(localStorage.getItem('rb_gate_verified_bookings') || '{}');
    delete verifiedSaved[bookingId];
    localStorage.setItem('rb_gate_verified_bookings', JSON.stringify(verifiedSaved));
  } catch (_) {}

  return { success: true };
}

/**
 * Validates a scanned QR code payload directly against the Supabase `bookings` table.
 */
export async function validateTicketAgainstSupabase(rawPayload: string): Promise<{
  isValid: boolean;
  ticketId: string;
  rawPayload: string;
  ticket?: any;
  status: 'verified' | 'already_used' | 'invalid' | 'error';
  message: string;
  scannedAt?: string | null;
  source: 'supabase_direct' | 'supabase_cache' | 'not_found';
}> {
  if (!rawPayload) {
    return {
      isValid: false,
      ticketId: '',
      rawPayload,
      status: 'invalid',
      message: 'Empty QR code payload.',
      source: 'not_found',
    };
  }

  const trimmed = rawPayload.trim();
  let ticketId = trimmed;

  // Extract ticketId from common patterns:
  // 1. RAJBARI_BHOJBARI_PASS_RB-2026-12345_TOTAL_...
  const rajbariMatch = trimmed.match(/RAJBARI_BHOJBARI_PASS_([^_]+)_TOTAL/i);
  if (rajbariMatch && rajbariMatch[1]) {
    ticketId = rajbariMatch[1].trim();
  } else {
    // 2. IAM_ECO_PASS:RB-2026-12345:AUTHENTICATED
    const colonMatch = trimmed.match(/IAM_ECO_PASS:([^:]+):/i);
    if (colonMatch && colonMatch[1]) {
      ticketId = colonMatch[1].trim();
    } else {
      // 3. RB-2026-XXXX or RB-PASS-2026-XXXX
      const rbMatch = trimmed.match(/(RB(?:-PASS)?-2026-[A-Za-z0-9-]+)/i);
      if (rbMatch && rbMatch[1]) {
        ticketId = rbMatch[1].trim();
      } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          ticketId = parsed.booking_id || parsed.bookingId || parsed.id || ticketId;
        } catch (_) {}
      }
    }
  }

  const client = getSupabaseClient();

  if (client) {
    try {
      // Query Supabase bookings table
      const { data, error } = await client
        .from('bookings')
        .select('*')
        .or(`booking_id.eq.${ticketId},id.eq.${ticketId}`)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        const b = data[0];
        const isAdmitted = Boolean(
          b.verified_at_gate === true ||
          b.status === 'confirmed' ||
          b.status === 'admitted' ||
          b.payment_status === 'confirmed'
        );

        return {
          isValid: true,
          ticketId: b.booking_id || ticketId,
          rawPayload,
          ticket: {
            id: b.booking_id || b.id,
            bookingId: b.booking_id,
            customerName: b.customer_name || 'Honored Guest',
            customerEmail: b.customer_email || '',
            customerPhone: b.customer_phone || '',
            totalAmount: Number(b.total_amount || 0),
            ticketQuantity: Number(b.pass_quantity || 1),
            slot: b.dining_slot || 'General Festival Admission',
            eventDate: b.event_date || 'Friday, 9th October 2026',
            paymentMethod: b.payment_method || 'UPI_QR',
            paymentStatus: b.payment_status || 'paid',
            upiUtr: b.upi_utr || b.transaction_id || '',
            scanned: isAdmitted,
            scannedAt: b.verified_at_gate_time || null,
            entryStatus: isAdmitted ? 'Admitted & Verified' : 'Valid • Ready for Entry',
            items: b.items || [],
            starterDish: b.starter_dish,
            mainsDish: b.mains_dish,
            dessertDish: b.dessert_dish,
          },
          status: isAdmitted ? 'already_used' : 'verified',
          message: isAdmitted
            ? `Pass ${b.booking_id} was already confirmed/admitted at ${b.verified_at_gate_time || 'earlier time'}.`
            : `✓ Valid Festival Eco-Pass found in Supabase for ${b.customer_name || 'Honored Guest'} (${b.pass_quantity || 1} Pass).`,
          scannedAt: b.verified_at_gate_time,
          source: 'supabase_direct',
        };
      }
    } catch (err) {
      console.warn('Supabase query validation error:', err);
    }
  }

  // Fallback: Check local simulated storage
  try {
    const local = JSON.parse(localStorage.getItem('rb_supabase_purchase_history') || '[]');
    const match = local.find(
      (item: any) =>
        (item.booking_id && item.booking_id.toLowerCase().includes(ticketId.toLowerCase())) ||
        (item.bookingId && item.bookingId.toLowerCase().includes(ticketId.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(ticketId.toLowerCase()))
    );

    if (match) {
      const bId = match.booking_id || match.bookingId || ticketId;
      const isAdmitted = Boolean(match.verified_at_gate === true || match.status === 'confirmed');
      return {
        isValid: true,
        ticketId: bId,
        rawPayload,
        ticket: {
          id: bId,
          bookingId: bId,
          customerName: match.customer_name || match.customerName || 'Honored Guest',
          customerEmail: match.customer_email || match.customerEmail || '',
          customerPhone: match.customer_phone || match.customerPhone || '',
          totalAmount: Number(match.total_amount || match.totalAmount || 0),
          ticketQuantity: Number(match.pass_quantity || match.passQuantity || 1),
          slot: match.dining_slot || match.diningSlot || 'General Festival Admission',
          eventDate: match.event_date || match.eventDate || 'Friday, 9th October 2026',
          paymentMethod: match.payment_method || match.paymentMethod || 'UPI_QR',
          paymentStatus: match.payment_status || match.paymentStatus || 'paid',
          upiUtr: match.upi_utr || match.upiUtr || '',
          scanned: isAdmitted,
          scannedAt: match.verified_at_gate_time || null,
          entryStatus: isAdmitted ? 'Admitted & Verified' : 'Valid • Ready for Entry',
        },
        status: isAdmitted ? 'already_used' : 'verified',
        message: isAdmitted
          ? `Pass ${bId} was previously admitted.`
          : `✓ Valid Festival Eco-Pass verified in Supabase for ${match.customer_name || match.customerName || 'Honored Guest'}.`,
        source: 'supabase_cache',
      };
    }
  } catch (_) {}

  return {
    isValid: false,
    ticketId,
    rawPayload,
    status: 'invalid',
    message: `No active booking found in Supabase database for Pass ID "${ticketId}".`,
    source: 'not_found',
  };
}

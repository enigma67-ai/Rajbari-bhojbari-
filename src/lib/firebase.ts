import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged, type User };

// Always pass databaseId from config
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Connection test helper per guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connection.');
      return false;
    }
    // Expected if document doesn't exist, but connection to server succeeded
    return true;
  }
}
testFirestoreConnection();

// Google Sign In
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign Out
export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Types
export interface SavedBooking {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    id: string;
    name: string;
    bengaliName?: string;
    mohol: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  serviceCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  dineSlot: string;
  seatCount: number;
  specialRequests?: string;
  bookingCode: string;
  createdAt: string;
}

// Save a booking to user's Firestore subcollection
export async function saveUserBooking(userId: string, bookingData: Omit<SavedBooking, 'id'>) {
  try {
    const userBookingsRef = collection(db, 'users', userId, 'bookings');
    const docRef = await addDoc(userBookingsRef, bookingData);
    return { id: docRef.id, ...bookingData };
  } catch (error) {
    console.error('Error saving booking to Firestore:', error);
    // Return with generated id as fallback so UX does not break
    return { id: `local_${Date.now()}`, ...bookingData };
  }
}

// Fetch all bookings for a user
export async function getUserBookings(userId: string): Promise<SavedBooking[]> {
  try {
    const userBookingsRef = collection(db, 'users', userId, 'bookings');
    const q = query(userBookingsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const bookings: SavedBooking[] = [];
    snapshot.forEach((docSnapshot) => {
      bookings.push({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<SavedBooking, 'id'>) });
    });
    return bookings;
  } catch (error) {
    console.warn('Error fetching user bookings:', error);
    return [];
  }
}

// Persist user chat message with BHOJ-Bot
export async function saveChatMessage(
  userId: string, 
  message: { role: 'user' | 'assistant'; text: string; source?: string; createdAt: string }
) {
  try {
    const chatRef = collection(db, 'users', userId, 'chatHistory');
    await addDoc(chatRef, message);
  } catch (error) {
    console.warn('Failed to persist chat message in Firestore:', error);
  }
}

// Fetch chat history for user
export async function getUserChatHistory(userId: string) {
  try {
    const chatRef = collection(db, 'users', userId, 'chatHistory');
    const q = query(chatRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const history: Array<{ id: string; role: 'user' | 'assistant'; text: string; source?: string; createdAt: string }> = [];
    snapshot.forEach((docSnap) => {
      history.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return history;
  } catch (error) {
    console.warn('Could not load chat history:', error);
    return [];
  }
}

// Persist or update user profile document in Firestore
export async function saveUserProfile(profile: {
  id: string;
  name: string;
  email?: string;
  emailOrPhone?: string;
  role?: string;
  dietaryPreferences?: string[];
  createdAt?: string;
}) {
  try {
    const userDocRef = doc(db, 'users', profile.id);
    await setDoc(userDocRef, {
      id: profile.id,
      name: profile.name,
      email: profile.email || profile.emailOrPhone || '',
      role: profile.role || 'guest',
      dietaryPreferences: profile.dietaryPreferences || [],
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Could not save user profile to Firestore:', error);
  }
}

// Fetch user profile from Firestore
export async function getUserProfile(userId: string) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch user profile from Firestore:', error);
    return null;
  }
}

// Persist Event Ticket Pass to Firestore
export async function saveTicketPass(ticketPass: any, userId?: string) {
  try {
    // If authenticated user, save in users/{userId}/tickets
    if (userId) {
      const userTicketRef = doc(db, 'users', userId, 'tickets', ticketPass.id);
      await setDoc(userTicketRef, {
        ...ticketPass,
        userId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Also persist in global tickets collection
    const globalTicketRef = doc(db, 'tickets', ticketPass.id);
    await setDoc(globalTicketRef, {
      ...ticketPass,
      userId: userId || 'guest',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.warn('Could not persist ticket pass to Firestore:', error);
    return false;
  }
}

// Fetch user ticket passes from Firestore
export async function getUserTicketPasses(userId: string) {
  try {
    const userTicketsRef = collection(db, 'users', userId, 'tickets');
    const snap = await getDocs(userTicketsRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Could not load user ticket passes from Firestore:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Error Handling conforming to Firebase Skill Guidelines
// ---------------------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// ---------------------------------------------------------------------------
// QR Code Parser & Ticket Validator for Entry Gate
// ---------------------------------------------------------------------------

/**
 * Extracts a clean Ticket/Booking Pass ID from various QR code formats:
 * - "IAM_ECO_PASS:RB-PASS-2026-12345:AUTHENTICATED:IAM_KOLKATA"
 * - "RAJBARI_BHOJBARI_PASS_RB-PASS-2026-12345_TOTAL_349_ENTRY_VALIDATED"
 * - "IAM_ECO_PASS_1712345678_TOTAL_349"
 * - URL query param `data=`
 * - Direct ID string "RB-PASS-2026-12345"
 * - JSON string with `id` or `bookingId`
 */
export function extractTicketIdFromPayload(rawPayload: string): string {
  if (!rawPayload) return '';
  const trimmed = rawPayload.trim();

  // 1. If it's a URL with data param
  if (trimmed.includes('http') && trimmed.includes('data=')) {
    try {
      const url = new URL(trimmed);
      const dataParam = url.searchParams.get('data');
      if (dataParam) {
        return extractTicketIdFromPayload(decodeURIComponent(dataParam));
      }
    } catch {
      // Ignore URL parse error and continue
    }
  }

  // 2. If it's a JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.bookingId) return String(parsed.bookingId).trim();
      if (parsed.passId) return String(parsed.passId).trim();
    } catch {
      // Ignore JSON parse error and continue
    }
  }

  // 3. Check for IAM_ECO_PASS:ID:AUTHENTICATED
  const colonMatch = trimmed.match(/IAM_ECO_PASS:([^:]+):/i);
  if (colonMatch && colonMatch[1]) {
    return colonMatch[1].trim();
  }

  // 4. Check for RAJBARI_BHOJBARI_PASS_ID_TOTAL
  const rajbariMatch = trimmed.match(/RAJBARI_BHOJBARI_PASS_([^_]+)_TOTAL/i);
  if (rajbariMatch && rajbariMatch[1]) {
    return rajbariMatch[1].trim();
  }

  // 5. Check for standard RB-PASS-2026-XXXXX
  const rbPassMatch = trimmed.match(/(RB-PASS-[A-Za-z0-9-]+)/i);
  if (rbPassMatch && rbPassMatch[1]) {
    return rbPassMatch[1].trim();
  }

  // 6. Check for IAM_ECO_PASS_XXXX
  const ecoPassMatch = trimmed.match(/(IAM_ECO_PASS_[A-Za-z0-9_-]+)/i);
  if (ecoPassMatch && ecoPassMatch[1]) {
    return ecoPassMatch[1].trim();
  }

  // Fallback: return cleaned raw string (up to 128 chars, alphanumeric + dashes)
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

export interface TicketValidationResult {
  isValid: boolean;
  ticketId: string;
  rawPayload: string;
  ticket?: any;
  status: 'verified' | 'already_used' | 'invalid' | 'error';
  message: string;
  scannedAt?: string;
  source: 'firestore_direct' | 'firestore_user' | 'not_found';
}

/**
 * Validates a scanned QR code payload against the Firestore database.
 * Checks `/tickets/{ticketId}` and returns detailed booking status.
 */
export async function validateTicketAgainstFirestore(rawPayload: string): Promise<TicketValidationResult> {
  const ticketId = extractTicketIdFromPayload(rawPayload);

  if (!ticketId) {
    return {
      isValid: false,
      ticketId: '',
      rawPayload,
      status: 'invalid',
      message: 'Could not extract a valid Ticket ID from the scanned QR code.',
      source: 'not_found',
    };
  }

  const path = `tickets/${ticketId}`;
  try {
    const ticketDocRef = doc(db, 'tickets', ticketId);
    const snap = await getDoc(ticketDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const isAlreadyUsed = Boolean(data.scanned);

      return {
        isValid: true,
        ticketId,
        rawPayload,
        ticket: { id: snap.id, ...data },
        status: isAlreadyUsed ? 'already_used' : 'verified',
        message: isAlreadyUsed 
          ? `Pass ${ticketId} has already been admitted at ${data.scannedAt || 'earlier time'}.`
          : `Valid Festival Eco-Pass found for ${data.customerName || 'Honored Guest'}.`,
        scannedAt: data.scannedAt,
        source: 'firestore_direct',
      };
    }

    // Secondary fallback: if current user is logged in, check user's bookings or tickets
    if (auth.currentUser?.uid) {
      try {
        const userTicketRef = doc(db, 'users', auth.currentUser.uid, 'tickets', ticketId);
        const userSnap = await getDoc(userTicketRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const isAlreadyUsed = Boolean(uData.scanned);
          return {
            isValid: true,
            ticketId,
            rawPayload,
            ticket: { id: userSnap.id, ...uData },
            status: isAlreadyUsed ? 'already_used' : 'verified',
            message: `Valid Eco-Pass verified in user records for ${uData.customerName || 'Guest'}.`,
            scannedAt: uData.scannedAt,
            source: 'firestore_user',
          };
        }
      } catch (userCheckErr) {
        console.warn('Subcollection check error:', userCheckErr);
      }
    }

    // Document not found in Firestore
    return {
      isValid: false,
      ticketId,
      rawPayload,
      status: 'invalid',
      message: `No active booking found in Firestore matching Pass ID: "${ticketId}". Please ensure the booking was confirmed or check spelling.`,
      source: 'not_found',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return {
      isValid: false,
      ticketId,
      rawPayload,
      status: 'error',
      message: `Failed to query Firestore database: ${error instanceof Error ? error.message : String(error)}`,
      source: 'not_found',
    };
  }
}

/**
 * Marks a ticket pass as scanned / admitted in Firestore.
 */
export async function markTicketAsAdmitted(ticketId: string, staffName = 'Gate Scanner'): Promise<{ success: boolean; error?: string }> {
  const path = `tickets/${ticketId}`;
  try {
    const ticketDocRef = doc(db, 'tickets', ticketId);
    const now = new Date().toISOString();
    
    await setDoc(ticketDocRef, {
      scanned: true,
      scannedAt: now,
      entryStatus: 'Admitted & Verified',
      admittedBy: staffName,
      updatedAt: now,
    }, { merge: true });

    // Also update in user's subcollection if logged in
    if (auth.currentUser?.uid) {
      try {
        const userTicketRef = doc(db, 'users', auth.currentUser.uid, 'tickets', ticketId);
        await setDoc(userTicketRef, {
          scanned: true,
          scannedAt: now,
          entryStatus: 'Admitted & Verified',
          admittedBy: staffName,
          updatedAt: now,
        }, { merge: true });
      } catch {
        // Non-blocking
      }
    }

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


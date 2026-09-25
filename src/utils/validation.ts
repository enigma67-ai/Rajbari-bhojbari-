import { z } from 'zod';

/**
 * ==============================================================================
 * 🛡️ INPUT VALIDATION & SANITIZATION UTILITIES
 * ==============================================================================
 * Prevents Cross-Site Scripting (XSS), SQL Injection, and Malformed Submissions.
 * Enforces strict character whitelisting on names and digits-only on phone numbers.
 */

// Regex patterns
export const NAME_REGEX = /^[a-zA-Z\u0980-\u09FF\s'.-]+$/; // English and Bengali letters, spaces, hyphens, dots, apostrophes
export const DIGITS_ONLY_REGEX = /^[0-9]+$/;
export const PHONE_REGEX = /^[0-9]{10}$/; // Strict 10-digit phone number

/**
 * Sanitizes generic string inputs to neutralize XSS and SQL injection payloads.
 * Strips HTML tags, script tags, null characters, and dangerous delimiters.
 */
export function sanitizeString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>?/gm, '') // Remove HTML/XML tags
    .replace(/javascript:/gi, '') // Remove pseudo-protocols
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .replace(/[\0\x08\x09\x1a\n\r"';\\]/g, (char) => {
      // Escape or strip control characters and SQL meta-characters
      switch (char) {
        case '\0': return '';
        case '\n': return ' ';
        case '\r': return ' ';
        case '\\': return '\\\\';
        case "'": return "''";
        case '"': return '&quot;';
        default: return '';
      }
    })
    .trim();
}

/**
 * Sanitizes names to strictly letters, spaces, hyphens, and apostrophes.
 * Rejects numbers and all special characters like <, >, {, }, $, ;, --, etc.
 */
export function sanitizeName(val: string): string {
  return val
    .replace(/<[^>]*>?/gm, '')
    .replace(/[^a-zA-Z\u0980-\u09FF\s'.-]/g, '') // Keep letters, spaces, hyphens, dots
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .slice(0, 60);
}

/**
 * Sanitizes phone number: strictly extracts digits and slices to max 10 digits.
 */
export function sanitizePhoneDigits(val: string): string {
  return val.replace(/\D/g, '').slice(0, 10);
}

/**
 * Zod Schema for Booking Form Validation
 */
export const bookingAttendeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name must not exceed 60 characters.')
    .regex(NAME_REGEX, 'Name can only contain letters, spaces, hyphens, and apostrophes (no special characters).')
    .transform(sanitizeName),

  phone: z
    .string()
    .trim()
    .transform(sanitizePhoneDigits)
    .refine((val) => val.length === 10, {
      message: 'Phone number must be exactly 10 digits (numbers only).',
    }),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(100, 'Email must not exceed 100 characters.')
    .refine((val) => !val.includes('<') && !val.includes('>') && !val.includes(';'), {
      message: 'Email address contains invalid characters.',
    }),

  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'At least 1 pass must be booked.')
    .max(20, 'Maximum 20 passes allowed per single booking.'),

  slot: z
    .string()
    .min(1, 'Please select a dining slot.')
    .transform(sanitizeString),

  eventDate: z
    .string()
    .min(1, 'Please select an event date.')
    .transform(sanitizeString),

  welcomeDrink: z.string().optional().transform((v) => sanitizeString(v || '')),
  starterDish: z.string().optional().transform((v) => sanitizeString(v || '')),
  mainsDish: z.string().optional().transform((v) => sanitizeString(v || '')),
  dessertDish: z.string().optional().transform((v) => sanitizeString(v || '')),
});

/**
 * Zod Schema for Contact Form
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name cannot exceed 60 characters.')
    .regex(NAME_REGEX, 'Name cannot contain numbers or special characters.')
    .transform(sanitizeName),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(100, 'Email cannot exceed 100 characters.'),

  phone: z
    .string()
    .trim()
    .transform(sanitizePhoneDigits)
    .refine((val) => val.length === 10 || val.length === 0, {
      message: 'Phone number must be exactly 10 digits.',
    })
    .optional(),

  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters.')
    .max(1000, 'Message cannot exceed 1000 characters.')
    .transform(sanitizeString),
});

/**
 * Zod Schema for Feedback Form
 */
export const feedbackFormSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name cannot exceed 60 characters.')
    .regex(NAME_REGEX, 'Name cannot contain numbers or special characters.')
    .transform(sanitizeName),

  contact: z
    .string()
    .trim()
    .min(5, 'Please provide email or 10-digit phone.')
    .max(100, 'Contact info is too long.')
    .transform(sanitizeString),

  rating: z.number().min(1).max(5),
  sustainabilityRating: z.number().min(1).max(5).optional(),
  comment: z
    .string()
    .trim()
    .min(5, 'Review must be at least 5 characters.')
    .max(800, 'Review cannot exceed 800 characters.')
    .transform(sanitizeString),
});

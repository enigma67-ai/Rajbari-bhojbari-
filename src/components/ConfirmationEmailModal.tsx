import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Send, 
  Check, 
  Copy, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  BookingConfirmationPayload, 
  createConfirmationMessageTemplate, 
  sendConfirmationNotification 
} from '../utils/confirmationEmailService';

interface ConfirmationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingConfirmationPayload | null;
}

export const ConfirmationEmailModal: React.FC<ConfirmationEmailModalProps> = ({
  isOpen,
  onClose,
  bookingData,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'credentials'>('preview');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !bookingData) return null;

  const { subject, html, plainText, qrCodeUrl } = createConfirmationMessageTemplate(bookingData);
  const isCash = bookingData.paymentMethod?.toLowerCase() === 'cash';

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus(null);
    try {
      const result = await sendConfirmationNotification(bookingData);
      setResendStatus(result.message || `Confirmation email resent to ${bookingData.customerEmail}`);
    } catch (err: any) {
      setResendStatus('Resend failed: ' + (err?.message || 'Check network connection.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyPlainText = () => {
    navigator.clipboard.writeText(plainText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-3xl bg-[#0c0a09] border-2 border-amber-600/60 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-stone-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 px-6 py-4 border-b border-amber-700/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
                  <span>Automated Confirmation Dispatch</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    Dispatched
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  Recipient: <span className="text-amber-200 font-medium">{bookingData.customerEmail}</span> ({bookingData.customerName})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Bar */}
          <div className="bg-stone-900/90 border-b border-stone-800 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                Rendered Invitation Letter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'text'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                SMS / WhatsApp Plain Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'credentials'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                API Keys & Config Guide
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPlainText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/50 text-amber-300 font-medium transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isResending ? 'Sending...' : 'Resend Email'}</span>
              </button>
            </div>
          </div>

          {/* Conditional Cash Alert Banner */}
          {isCash && (
            <div className="bg-amber-950/70 border-b border-amber-600/50 px-6 py-2.5 flex items-center gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Conditional Cash Rule Applied:</strong> "Note: You have selected to pay by cash. Please bring ₹{bookingData.totalAmount}/- to pay at the entrance before you can scan your QR code and enter."
              </span>
            </div>
          )}

          {/* Resend status toast */}
          {resendStatus && (
            <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'preview' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs flex items-center justify-between">
                  <span className="text-stone-400">
                    Subject: <strong className="text-amber-200">{subject}</strong>
                  </span>
                  <span className="font-mono text-stone-400">HTML Template</span>
                </div>

                {/* Rendered HTML inside sandboxed frame or container */}
                <div className="border border-stone-800 rounded-2xl overflow-hidden bg-[#1c1917]">
                  <iframe
                    title="Confirmation Email Preview"
                    srcDoc={html}
                    className="w-full h-[500px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs flex items-center justify-between">
                  <span className="text-stone-400">
                    Recipient Mobile: <strong className="text-amber-200">{bookingData.customerPhone}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPlainText}
                    className="text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    {copiedText ? 'Copied to Clipboard' : 'Copy for WhatsApp/SMS'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 font-mono text-xs text-stone-300 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                  {plainText}
                </div>
              </div>
            )}

            {activeTab === 'credentials' && (
              <div className="space-y-4 text-xs text-left">
                <div className="p-4 rounded-2xl bg-stone-950 border border-amber-600/30 space-y-3">
                  <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>How to Configure Real Automated Email Delivery</span>
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    This booking system includes both <strong>Backend (Nodemailer / SendGrid)</strong> and <strong>Frontend (EmailJS)</strong> sending mechanisms with automated fallback simulation.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                      <span className="font-bold text-amber-300 block">Method 1: Backend SMTP / Gmail (Nodemailer)</span>
                      <p className="text-stone-400">
                        Add to your <code className="text-amber-200 font-mono">.env</code> file:
                      </p>
                      <pre className="p-2 rounded bg-black/60 text-stone-300 font-mono text-[11px] overflow-x-auto">
{`SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="IAM AI Zero-Waste Food Fest <fest@iam.ac.in>"`}
                      </pre>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                      <span className="font-bold text-amber-300 block">Method 2: Frontend EmailJS (@emailjs/browser)</span>
                      <p className="text-stone-400">
                        Add to your <code className="text-amber-200 font-mono">.env</code> file:
                      </p>
                      <pre className="p-2 rounded bg-black/60 text-stone-300 font-mono text-[11px] overflow-x-auto">
{`VITE_EMAILJS_SERVICE_ID="service_xxx"
VITE_EMAILJS_TEMPLATE_ID="template_xxx"
VITE_EMAILJS_PUBLIC_KEY="public_key_xxx"`}
                      </pre>
                      <p className="text-[11px] text-amber-300/90 pt-1 font-mono">
                        Template parameters mapped: <code className="text-emerald-300">to_email</code>, <code className="text-emerald-300">to_name</code>, <code className="text-emerald-300">qr_code_link</code>, <code className="text-emerald-300">venue</code>, <code className="text-emerald-300">date_time</code>, <code className="text-emerald-300">official_email</code>, <code className="text-emerald-300">official_phone</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-stone-950 px-6 py-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>QR code linked to booking ID: <strong className="text-amber-300 font-mono">{bookingData.bookingId}</strong></span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

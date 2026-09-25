import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { 
  QrCode, 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  MapPin, 
  Utensils, 
  Check, 
  Copy, 
  SwitchCamera,
  ExternalLink,
  Shield,
  Loader2,
  FileText
} from 'lucide-react';
import { 
  validateTicketAgainstFirestore, 
  markTicketAsAdmitted, 
  saveTicketPass, 
  TicketValidationResult,
  extractTicketIdFromPayload 
} from '../lib/firebase';
import { EventTicketPass, UserProfile } from '../types';
import { triggerFestiveCelebration, playCelebrationChime } from '../utils/confettiCelebration';

interface TicketQrScannerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  latestPass?: EventTicketPass | null;
  onTicketValidated?: (result: TicketValidationResult) => void;
}

export const TicketQrScannerOverlay: React.FC<TicketQrScannerOverlayProps> = ({
  isOpen,
  onClose,
  currentUser,
  latestPass,
  onTicketValidated,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [admitSuccess, setAdmitSuccess] = useState<string | null>(null);

  // Manual input state
  const [manualCode, setManualCode] = useState('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // List available video devices
  useEffect(() => {
    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      }).catch(err => {
        console.warn('Could not enumerate media devices:', err);
      });
    }
  }, []);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser environment. Please use image upload or manual ID verification.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or use the Image Upload / Manual Input tabs below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No video camera was detected on this device. Please use Image Upload or Manual ID entry.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to access camera.'} Try Upload or Manual Code below.`);
      }
    }
  }, [facingMode, stopCamera]);

  // Handle validating extracted QR code payload against Firestore
  const handleValidatePayload = useCallback(async (payload: string) => {
    if (!payload.trim() || isVerifying) return;

    setIsVerifying(true);
    setAdmitSuccess(null);
    try {
      const result = await validateTicketAgainstFirestore(payload);
      setValidationResult(result);

      if (result.isValid && result.status === 'verified') {
        try {
          playCelebrationChime();
          triggerFestiveCelebration();
        } catch {}
      }

      if (onTicketValidated) {
        onTicketValidated(result);
      }
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, onTicketValidated]);

  // Continuous frame scanner loop
  const tickScan = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        // Detected a QR code!
        stopCamera();
        handleValidatePayload(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(tickScan);
  }, [handleValidatePayload, stopCamera]);

  // Manage camera lifecycle when overlay opens/closes or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !validationResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, validationResult, startCamera, stopCamera]);

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImagePreview(img.src);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleValidatePayload(code.data);
          } else {
            setValidationResult({
              isValid: false,
              ticketId: '',
              rawPayload: 'Uploaded Image',
              status: 'invalid',
              message: 'No readable QR code found in this image. Please upload a clear photo or screenshot of the ticket QR code.',
              source: 'not_found',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Mark ticket as admitted in Firestore
  const handleMarkAdmitted = async () => {
    if (!validationResult?.ticketId) return;

    setIsAdmitting(true);
    try {
      const res = await markTicketAsAdmitted(
        validationResult.ticketId, 
        currentUser?.name ? `Gate Staff (${currentUser.name})` : 'IAM Gate Security'
      );
      if (res.success) {
        setAdmitSuccess(`Successfully admitted pass ${validationResult.ticketId} into IAM Kolkata Fest.`);
        // Refresh validation state
        setValidationResult(prev => prev ? {
          ...prev,
          status: 'already_used',
          message: `Pass ${validationResult.ticketId} has been successfully validated and admitted.`,
          scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ticket: {
            ...prev.ticket,
            scanned: true,
            scannedAt: new Date().toISOString(),
            entryStatus: 'Admitted & Verified',
          }
        } : null);
      }
    } catch (err: any) {
      console.error('Error admitting ticket:', err);
    } finally {
      setIsAdmitting(false);
    }
  };

  // Quick Seed & Test Sample Pass
  const handleCreateAndTestSamplePass = async () => {
    setIsVerifying(true);
    const sampleId = 'RB-PASS-2026-' + Math.floor(10000 + Math.random() * 90000);
    const customerEmail = currentUser?.emailOrPhone?.includes('@') 
      ? currentUser.emailOrPhone 
      : 'aritra.sen@iam.ac.in';
    const customerPhone = currentUser?.emailOrPhone && !currentUser.emailOrPhone.includes('@')
      ? currentUser.emailOrPhone
      : '98301 44521';

    const samplePass = {
      id: sampleId,
      customerName: currentUser?.name || 'Aritra Sen (Royal Guest)',
      customerPhone,
      customerEmail,
      ticketQuantity: 2,
      basePricePerTicket: 349,
      totalAmount: 797,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      slot: 'Grand Aristocratic Dinner (7:30 PM - 10:30 PM)',
      eventDate: 'Friday, 9th October 2026',
      welcomeDrink: 'Aam Pora Lebu Shorbot (Complimentary)',
      starterDish: 'Murgir Jali Kebab (Non-Veg)',
      mainsDish: 'Combo 1 (Chicken): Desi Murgir Fowl Curry served with Cholar Daler Polao',
      dessertDish: 'Misti Mukh Platter (Piyazer Payes, Porochitroharini)',
      gateLocation: 'Main Green Gate, IAM Kolkata Campus',
      transactionId: 'TXN-PASS-' + Date.now().toString(36).toUpperCase(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=IAM_ECO_PASS:${sampleId}:AUTHENTICATED:IAM_KOLKATA`,
      scanned: false,
      bookedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveTicketPass(samplePass, currentUser?.id);
      // Validate this created pass
      await handleValidatePayload(`IAM_ECO_PASS:${sampleId}:AUTHENTICATED:IAM_KOLKATA`);
    } catch (err) {
      console.warn('Sample pass creation error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetScanner = () => {
    setValidationResult(null);
    setUploadedImagePreview(null);
    setAdmitSuccess(null);
    setManualCode('');
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#092218] via-[#04130c] to-[#020906] border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto text-stone-200"
        >
          {/* Header Banner */}
          <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-emerald-500/20 bg-emerald-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg sm:text-xl text-white tracking-wide">
                    Ticket QR Scanner
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 uppercase tracking-wider">
                    Firestore Live DB
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80">
                  Scan or verify unique festival Eco-Passes against database
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Mode Selector Tabs (only when not showing a validation result) */}
            {!validationResult && (
              <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-2xl border border-emerald-500/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    setCameraError(null);
                  }}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'camera'
                      ? 'bg-emerald-500 text-stone-950 font-bold shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    stopCamera();
                  }}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'upload'
                      ? 'bg-emerald-500 text-stone-950 font-bold shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                    stopCamera();
                  }}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'manual'
                      ? 'bg-emerald-500 text-stone-950 font-bold shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Manual ID</span>
                </button>
              </div>
            )}

            {/* Loading Verification State */}
            {isVerifying && (
              <div className="py-12 px-4 text-center space-y-3 bg-black/40 rounded-2xl border border-emerald-500/20">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <h4 className="text-base font-bold text-white">Validating with Firestore...</h4>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Cross-referencing scanned pass against collection <span className="font-mono text-emerald-300">/tickets/{'{ticketId}'}</span>...
                </p>
              </div>
            )}

            {/* TAB 1: Live Camera Scanner */}
            {!isVerifying && !validationResult && activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] w-full max-w-md mx-auto bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Target Scanner Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center">
                      {/* Corner marks */}
                      <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                      
                      {/* Animated Laser Scanning Line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-bounce" />
                    </div>
                  </div>

                  {/* Top Bar inside Viewfinder */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      LIVE SCANNER
                    </span>
                    {availableCameras.length > 1 && (
                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="flex items-center gap-1 text-stone-300 hover:text-white bg-white/10 px-2 py-0.5 rounded-lg"
                      >
                        <SwitchCamera className="w-3 h-3" />
                        <span>Flip Cam</span>
                      </button>
                    )}
                  </div>

                  {/* Camera Error / Fallback Card inside viewfinder */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-stone-950/95 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
                      <AlertTriangle className="w-10 h-10 text-amber-400" />
                      <p className="text-xs text-stone-300 max-w-xs">{cameraError}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                        >
                          Upload Ticket Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manual')}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors"
                        >
                          Enter Code
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-stone-400">
                  Align attendee's pass QR code within the highlighted frame to automatically verify.
                </p>
              </div>
            )}

            {/* TAB 2: Image Upload */}
            {!isVerifying && !validationResult && activeTab === 'upload' && (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-black/30 hover:bg-emerald-950/20 transition-all text-center">
                  <Upload className="w-10 h-10 text-emerald-400" />
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Click to browse or drop ticket pass image
                    </span>
                    <span className="text-xs text-stone-400">
                      Supports PNG, JPG, or screenshot of digital pass or email ticket
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {uploadedImagePreview && (
                  <div className="p-3 bg-black/40 rounded-xl border border-stone-800 flex items-center gap-3">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded QR"
                      className="w-16 h-16 object-cover rounded-lg border border-stone-700"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-white block">Image uploaded</span>
                      <span className="text-stone-400">Analyzing QR barcode pattern...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Manual ID Input */}
            {!isVerifying && !validationResult && activeTab === 'manual' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Enter Ticket ID or QR Code Payload</span>
                    <span className="text-[10px] text-emerald-400 font-normal">e.g. RB-PASS-2026-12345</span>
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Paste QR payload or RB-PASS-2026-..."
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-emerald-500/30 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!manualCode.trim() || isVerifying}
                  onClick={() => handleValidatePayload(manualCode)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify in Firestore Database</span>
                </button>

                {/* Quick actions for test / recently booked pass */}
                <div className="pt-2 border-t border-stone-800 space-y-2">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold block">
                    Quick Verification Shortcuts:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {latestPass?.id && (
                      <button
                        type="button"
                        onClick={() => handleValidatePayload(latestPass.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                      >
                        <TicketQrIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verify Your Current Pass ({latestPass.id})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateAndTestSamplePass}
                      className="px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate & Validate Sample Firestore Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VALIDATION RESULT VIEW */}
            {!isVerifying && validationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Result Status Banner */}
                {validationResult.status === 'verified' && (
                  <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-400/60 shadow-lg flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          AUTHENTIC & VERIFIED PASS
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-stone-950 text-[10px] font-black tracking-wider uppercase">
                          Confirmed
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200">
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {validationResult.status === 'already_used' && (
                  <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-400/60 shadow-lg flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          PASS ALREADY ADMITTED / USED
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black tracking-wider uppercase">
                          Scanned
                        </span>
                      </div>
                      <p className="text-xs text-amber-200">
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {validationResult.status === 'invalid' && (
                  <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-400/60 shadow-lg flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-300 flex-shrink-0 mt-0.5">
                      <XCircle className="w-6 h-6 text-rose-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          INVALID OR UNREGISTERED TICKET
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tracking-wider uppercase">
                          Not Found
                        </span>
                      </div>
                      <p className="text-xs text-rose-200">
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detailed Ticket Card (if valid pass found in Firestore) */}
                {validationResult.isValid && validationResult.ticket && (
                  <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                    {/* Top Row: Pass ID & Gate Location */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">Ticket Identifier</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-sm sm:text-base">
                            {validationResult.ticket.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(validationResult.ticket.id)}
                            className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-stone-200"
                            title="Copy ID"
                          >
                            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">Entry Gate</span>
                        <span className="text-xs text-stone-300 font-semibold flex items-center justify-end gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {validationResult.ticket.gateLocation || 'Main Green Gate, IAM Kolkata Campus'}
                        </span>
                      </div>
                    </div>

                    {/* Guest & Schedule Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Guest Details</span>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{validationResult.ticket.customerName || 'Honored Guest'}</span>
                        </div>
                        {validationResult.ticket.customerEmail && (
                          <div className="text-stone-400 flex items-center gap-1.5 text-[11px] truncate">
                            <Mail className="w-3 h-3 text-stone-500" />
                            <span>{validationResult.ticket.customerEmail}</span>
                          </div>
                        )}
                        {validationResult.ticket.customerPhone && (
                          <div className="text-stone-400 flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-stone-500" />
                            <span>+91 {validationResult.ticket.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Session & Quantity</span>
                        <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{validationResult.ticket.eventDate || 'Friday, 9th October 2026'}</span>
                        </div>
                        <div className="text-stone-300 flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>{validationResult.ticket.slot || 'Grand Aristocratic Dinner'}</span>
                        </div>
                        <div className="text-stone-300 text-[11px] font-bold">
                          Pass Quantity: <span className="text-emerald-400">{validationResult.ticket.ticketQuantity || 1} Guest(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Meal & Courses Details */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Included Royal Courses:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-stone-300 pl-4 border-l-2 border-emerald-500/40">
                        {validationResult.ticket.starterDish && (
                          <div>• Starter: <span className="text-white font-medium">{validationResult.ticket.starterDish}</span></div>
                        )}
                        {validationResult.ticket.mainsDish && (
                          <div>• Mains Combo: <span className="text-white font-medium">{validationResult.ticket.mainsDish}</span></div>
                        )}
                        {validationResult.ticket.dessertDish && (
                          <div>• Dessert: <span className="text-amber-300 font-medium">{validationResult.ticket.dessertDish}</span></div>
                        )}
                        <div>• Tasting: <span className="text-emerald-400">Rural Bengal Counter & Tok, Jhol, Ambol (Complimentary)</span></div>
                      </div>
                    </div>

                    {/* Payment & Sustainability Points */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-400/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                          <span>+120 Karma Points Verified</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-stone-400 text-[11px]">Total Paid: </span>
                        <span className="font-bold text-white text-sm">
                          ₹{validationResult.ticket.totalAmount || 349}/-
                        </span>
                        <span className="ml-1.5 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                          {validationResult.ticket.paymentMethod || 'Paid'}
                        </span>
                      </div>
                    </div>

                    {/* Gate Check-in Action */}
                    {!validationResult.ticket.scanned && (
                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isAdmitting}
                          onClick={handleMarkAdmitted}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isAdmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Updating Firestore Status...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                              <span>Admit Guest & Mark Pass as Used in Firestore</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {admitSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{admitSuccess}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Scan Another or Close Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleResetScanner}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Scan Another Ticket</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs sm:text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}

            {/* Quick Helper footer */}
            <div className="pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-[11px] text-stone-400 gap-2">
              <span className="flex items-center gap-1 text-emerald-400/90 font-mono">
                <Shield className="w-3.5 h-3.5" />
                Firestore Collection: /tickets
              </span>
              <span>IAM Kolkata Fest Security Gate 2026</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function TicketQrIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h.01" />
      <path d="M17 7h.01" />
      <path d="M7 17h.01" />
      <path d="M17 17h.01" />
    </svg>
  );
}
export default TicketQrScannerOverlay;

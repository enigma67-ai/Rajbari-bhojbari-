import React from 'react';

interface IAMChefLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * IAM (Institute of Advanced Management) AI Chef Mascot Logo ("HOSPI" / Bhoj-Bot)
 * High-definition vector rendition of the official IAM Hotel School AI culinary mascot.
 */
export const IAMChefLogo: React.FC<IAMChefLogoProps> = ({ 
  className = "w-10 h-10", 
  size,
  glow = true 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {glow && (
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-sm pointer-events-none" />
      )}
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        {/* Outer Circular Medallion */}
        <circle cx="250" cy="250" r="238" fill="#F4EFE6" stroke="#1E2833" strokeWidth="16" />
        <circle cx="250" cy="250" r="222" fill="#FAF6EE" stroke="#C5A059" strokeWidth="3" />

        {/* Ambient Sparkles */}
        <path d="M165 110L168 122L180 125L168 128L165 140L162 128L150 125L162 122Z" fill="#C5A059" />
        <path d="M125 125L127 132L134 134L127 136L125 143L123 136L116 134L123 132Z" fill="#C5A059" opacity="0.8" />
        <path d="M375 140L378 152L390 155L378 158L375 170L372 158L360 155L372 152Z" fill="#C5A059" />
        <path d="M385 105L387 112L394 114L387 116L385 123L383 116L376 114L383 112Z" fill="#C5A059" opacity="0.8" />

        {/* ================= CHEF HAT ================= */}
        <g id="chef-hat">
          {/* Hat Puff Base & Folds */}
          <path
            d="M175 150 C155 115 175 70 215 65 C225 35 275 35 285 65 C325 70 345 115 325 150 Z"
            fill="#FFFFFF"
            stroke="#1E2833"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          {/* Pleat Shading Lines */}
          <path d="M215 68 C225 95 228 135 230 148" stroke="#D1D5DB" strokeWidth="4" strokeLinecap="round" />
          <path d="M285 68 C275 95 272 135 270 148" stroke="#D1D5DB" strokeWidth="4" strokeLinecap="round" />
          <path d="M250 48 C250 85 250 125 250 148" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />

          {/* Hat Cylindrical Band */}
          <path
            d="M198 140 L302 140 L308 215 C308 220 300 226 250 226 C200 226 192 220 192 215 Z"
            fill="#EFECE4"
            stroke="#1E2833"
            strokeWidth="9"
            strokeLinejoin="round"
          />

          {/* IAM Hotel School Emblem on Hat */}
          {/* Classical Temple Pediment */}
          <path d="M242 165 L250 159 L258 165 Z" fill="#1E293B" stroke="#1E293B" strokeWidth="1" />
          <line x1="243" y1="168" x2="257" y2="168" stroke="#1E293B" strokeWidth="1.5" />
          {/* Columns */}
          <line x1="244" y1="168" x2="244" y2="178" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="248" y1="168" x2="248" y2="178" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="252" y1="168" x2="252" y2="178" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="256" y1="168" x2="256" y2="178" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="242" y1="178" x2="258" y2="178" stroke="#1E293B" strokeWidth="1.5" />

          {/* IAM Text */}
          <text
            x="250"
            y="191"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="12.5"
            fill="#1E293B"
            letterSpacing="2.5"
          >
            IAM
          </text>
          {/* HOTEL SCHOOL Text & underline */}
          <text
            x="250"
            y="200"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="5.5"
            fill="#475569"
            letterSpacing="1.2"
          >
            HOTEL SCHOOL
          </text>
          <line x1="226" y1="204" x2="274" y2="204" stroke="#94A3B8" strokeWidth="1" />
        </g>

        {/* ================= ROBOT HEAD ================= */}
        <g id="robot-head">
          {/* Left Ear Speaker / Node */}
          <rect x="156" y="235" width="22" height="42" rx="10" fill="#334155" stroke="#1E2833" strokeWidth="8" />
          <circle cx="167" cy="256" r="6" fill="#F8FAFC" />
          <circle cx="167" cy="256" r="3" fill="#38BDF8" />

          {/* Right Ear Speaker / Node */}
          <rect x="322" y="235" width="22" height="42" rx="10" fill="#334155" stroke="#1E2833" strokeWidth="8" />
          <circle cx="333" cy="256" r="6" fill="#F8FAFC" />
          <circle cx="333" cy="256" r="3" fill="#38BDF8" />

          {/* Outer Head Shell */}
          <rect
            x="172"
            y="192"
            width="156"
            height="116"
            rx="54"
            fill="#FFFFFF"
            stroke="#1E2833"
            strokeWidth="10"
          />

          {/* Screen Visor Face */}
          <rect
            x="186"
            y="206"
            width="128"
            height="86"
            rx="40"
            fill="#0F172A"
            stroke="#1E2833"
            strokeWidth="5"
          />

          {/* Glowing Eyes (^ ^) */}
          {/* Left Eye */}
          <path
            d="M214 246 C219 233 231 233 236 246"
            stroke="#38BDF8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Right Eye */}
          <path
            d="M264 246 C269 233 281 233 286 246"
            stroke="#38BDF8"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Cheerful Mouth Curve */}
          <path
            d="M241 262 C245 272 255 272 259 262"
            fill="#38BDF8"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* ================= NECK & COLLAR ================= */}
        <g id="neck-collar">
          <rect x="234" y="302" width="32" height="20" fill="#CBD5E1" stroke="#1E2833" strokeWidth="7" />
          {/* Gold Trim Collar */}
          <path d="M215 315 L285 315 L280 332 L220 332 Z" fill="#F8FAFC" stroke="#C5A059" strokeWidth="5" />
          {/* Black Bowtie */}
          <path d="M236 322 L248 328 L236 334 Z" fill="#0F172A" />
          <path d="M264 322 L252 328 L264 334 Z" fill="#0F172A" />
          <circle cx="250" cy="328" r="4.5" fill="#1E293B" />
        </g>

        {/* ================= BODY & CHEF COAT ================= */}
        <g id="chef-coat">
          {/* Base White Coat Body */}
          <path
            d="M170 472 L180 342 C185 328 205 320 220 320 L280 320 C295 320 315 328 320 342 L330 472 Z"
            fill="#FFFFFF"
            stroke="#1E2833"
            strokeWidth="10"
            strokeLinejoin="round"
          />

          {/* Shoulders & Sleeves Base */}
          <path d="M185 340 L135 440" stroke="#1E2833" strokeWidth="10" strokeLinecap="round" />
          <path d="M315 340 L365 440" stroke="#1E2833" strokeWidth="10" strokeLinecap="round" />

          {/* Left Sleeve (Robot Arm) */}
          <path
            d="M180 340 L135 435 L175 450 L205 375 Z"
            fill="#FFFFFF"
            stroke="#1E2833"
            strokeWidth="8"
          />
          {/* Left Sleeve Dark/Gold Cuff */}
          <rect x="160" y="420" width="35" height="20" rx="4" transform="rotate(-25 160 420)" fill="#1E293B" stroke="#C5A059" strokeWidth="3" />

          {/* Right Sleeve (Robot Arm with Red Royal/Heritage Drape) */}
          <path
            d="M320 340 L365 435 L325 450 L295 375 Z"
            fill="#FFFFFF"
            stroke="#1E2833"
            strokeWidth="8"
          />
          {/* Right Sleeve Dark/Gold Cuff */}
          <rect x="305" y="432" width="35" height="20" rx="4" transform="rotate(25 305 432)" fill="#1E293B" stroke="#C5A059" strokeWidth="3" />

          {/* Crimson & Gold Culinary Heritage Sash on Right Shoulder */}
          <path
            d="M272 320 C295 320 338 340 355 400 L320 440 L285 365 Z"
            fill="#881337"
            stroke="#1E2833"
            strokeWidth="6"
          />
          {/* Gold Embroidered Border on Sash */}
          <path
            d="M272 320 L285 365 L320 440"
            stroke="#C5A059"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Fine pattern dashes on sash */}
          <path d="M280 340 L285 345 M292 360 L297 365 M306 385 L311 390 M315 410 L320 415" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />

          {/* HOSPI Nametag on Left Chest */}
          <rect x="194" y="360" width="46" height="18" rx="4" fill="#1E293B" stroke="#C5A059" strokeWidth="2.5" />
          <text
            x="217"
            y="373"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="9"
            fill="#F8FAFC"
            letterSpacing="1.2"
          >
            HOSPI
          </text>

          {/* Coat Center Fold & Buttons */}
          <line x1="250" y1="334" x2="250" y2="400" stroke="#E2E8F0" strokeWidth="3" />
          <circle cx="260" cy="358" r="3" fill="#1E293B" />
          <circle cx="260" cy="382" r="3" fill="#1E293B" />

          {/* Crimson Waist Sash Band */}
          <path
            d="M185 435 C205 440 295 440 315 435 L318 465 C295 470 205 470 182 465 Z"
            fill="#9F1239"
            stroke="#1E2833"
            strokeWidth="7"
          />
          <line x1="183" y1="450" x2="317" y2="450" stroke="#BE123C" strokeWidth="3" />
        </g>

        {/* ================= ROBOT HANDS IN NAMASTE ================= */}
        <g id="namaste-hands">
          {/* Hands held in prayer pose in the center */}
          {/* Left Hand Fingers */}
          <path
            d="M242 410 C242 390 248 368 250 365 C252 368 258 390 258 410 L250 422 Z"
            fill="#F1F5F9"
            stroke="#1E2833"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Finger Joints Line */}
          <line x1="250" y1="366" x2="250" y2="420" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          {/* Knuckle Lines */}
          <path d="M245 385 L255 385" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M244 398 L256 398" stroke="#CBD5E1" strokeWidth="2" />
          {/* Wrist Sleeves Junction */}
          <circle cx="250" cy="425" r="7" fill="#334155" />
        </g>
      </svg>
    </div>
  );
};

const { useState, useEffect, useMemo, useRef } = React;

// --- AUTH CONFIGURATION & PERSISTENT SESSION HELPERS ---
const VALID_USERNAME = "Ponziano";
const VALID_PASSWORD = "1234";
const AUTH_STORAGE_KEY = "tasklog_pro_permanent_auth";
const AUTH_COOKIE_NAME = "tasklog_auth_token";

// Retrieve permanent session from localStorage or permanent cookie
function getStoredAuth() {
  try {
    // 1. Try LocalStorage
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data && data.authenticated && data.username && data.username.toLowerCase() === VALID_USERNAME.toLowerCase()) {
        return data;
      }
    }

    // 2. Fallback: check permanent Cookie
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
      const parts = c.trim().split("=");
      if (parts[0] === AUTH_COOKIE_NAME && parts[1]) {
        const decoded = JSON.parse(decodeURIComponent(parts.slice(1).join("=")));
        if (decoded && decoded.authenticated && decoded.username && decoded.username.toLowerCase() === VALID_USERNAME.toLowerCase()) {
          // Re-sync with localStorage
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(decoded));
          return decoded;
        }
      }
    }
  } catch (err) {
    console.error("Auth parsing error:", err);
  }
  return null;
}

// Store session permanently (infinite localStorage + 10-year max cookie)
function setPermanentAuth(username) {
  const authData = {
    authenticated: true,
    username: username || VALID_USERNAME,
    loginTimestamp: Date.now(),
    loginDate: new Date().toISOString(),
    permanentSession: true,
    token: "tk_perm_" + Math.random().toString(36).substring(2) + Date.now().toString(36)
  };

  // LocalStorage has no expiration by browser design
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

  // Cookie configured with 10 years Max-Age (315,360,000 seconds)
  const maxAgeSeconds = 315360000;
  const expireDate = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(authData))}; expires=${expireDate}; Max-Age=${maxAgeSeconds}; path=/; SameSite=Lax`;

  return authData;
}

// Remove permanent session
function clearPermanentAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Max-Age=0`;
}

// --- INITIAL SAMPLE DATA ---
const DEFAULT_DEMO_ACTIVITIES = [
  {
    id: "act-101",
    date: new Date().toISOString().split("T")[0],
    project: "Piattaforma E-Commerce B2B",
    title: "Implementazione gateway pagamenti Stripe e verifica webhook",
    category: "Sviluppo & IT",
    hours: 3.5,
    status: "Completata",
    priority: "Alta",
    operator: "Ponziano",
    notes: "Configurati gli endpoint sicuri per 3D Secure e gestione rimborsi automatici. Test superati in sandbox."
  },
  {
    id: "act-102",
    date: new Date().toISOString().split("T")[0],
    project: "Piattaforma E-Commerce B2B",
    title: "Allineamento sprint con team backend e product manager",
    category: "Meeting & Sync",
    hours: 1.0,
    status: "Completata",
    priority: "Media",
    operator: "Ponziano",
    notes: "Definite le priorità di rilascio per la release 2.4 entro fine mese."
  },
  {
    id: "act-103",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    project: "CRM Aziendale Custom",
    title: "Ottimizzazione query PostgreSQL e indicizzazione report fatture",
    category: "Sviluppo & IT",
    hours: 4.0,
    status: "Completata",
    priority: "Urgente",
    operator: "Ponziano",
    notes: "Tempi di generazione report mensile ridotti da 4.8s a 320ms con indici composti."
  },
  {
    id: "act-104",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    project: "Sicurezza & Compliance",
    title: "Audit trimestrale permessi utenti e revisione log di accesso",
    category: "Revisione & QA",
    hours: 2.5,
    status: "Completata",
    priority: "Media",
    operator: "Ponziano",
    notes: "Revocati 4 account obsoleti e abilitata autenticazione a due fattori (MFA) obbligatoria."
  },
  {
    id: "act-105",
    date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    project: "App Mobile Logistica",
    title: "Sviluppo modulo scansione barcode con fotocamera",
    category: "Sviluppo & IT",
    hours: 5.0,
    status: "In corso",
    priority: "Alta",
    operator: "Ponziano",
    notes: "Integrata libreria di scansione rapida per codici EAN-13 e QR Code pallet."
  },
  {
    id: "act-106",
    date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
    project: "Portale Fornitori",
    title: "Supporto tecnico per onboarding nuovi partner commerciali",
    category: "Supporto Clienti",
    hours: 2.0,
    status: "Completata",
    priority: "Bassa",
    operator: "Ponziano",
    notes: "Assistenza guidata per caricamento listini e firma digitale contratti quadro."
  },
  {
    id: "act-107",
    date: new Date().toISOString().split("T")[0],
    project: "Infrastruttura Cloud",
    title: "Configurazione backup automatizzati e test disaster recovery",
    category: "Sviluppo & IT",
    hours: 2.5,
    status: "In revisione",
    priority: "Alta",
    operator: "Ponziano",
    notes: "Snapshot orari configurati su storage georidondante. Verifica ripristino programmata per domani."
  }
];

const CATEGORIES = [
  "Sviluppo & IT",
  "Consulenza",
  "Meeting & Sync",
  "Supporto Clienti",
  "Revisione & QA",
  "Amministrazione",
  "Ricerca & R&D"
];

const STATUSES = ["Pianificata", "In corso", "In revisione", "Completata"];
const PRIORITIES = ["Bassa", "Media", "Alta", "Urgente"];

// --- INLINE SVG ICONS ---
const Icons = {
  Logo: () => (
    <svg className="w-8 h-8 drop-shadow" viewBox="0 0 512 512" fill="none">
      <rect width="512" height="512" rx="110" fill="#67001A"/>
      <rect x="100" y="90" width="312" height="340" rx="28" fill="#FFFFFF"/>
      <rect x="180" y="65" width="152" height="50" rx="14" fill="#4A0E17"/>
      <circle cx="256" cy="90" r="10" fill="#FFFFFF"/>
      <rect x="140" y="160" width="90" height="16" rx="8" fill="#800020"/>
      <rect x="245" y="160" width="130" height="16" rx="8" fill="#E2E8F0"/>
      <circle cx="160" cy="225" r="18" fill="#800020"/>
      <path d="M152 225l6 6 12-12" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="195" y="217" width="180" height="16" rx="8" fill="#4A0E17"/>
      <circle cx="160" cy="285" r="18" fill="#800020"/>
      <path d="M152 285l6 6 12-12" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="195" y="277" width="150" height="16" rx="8" fill="#4A0E17"/>
      <circle cx="160" cy="345" r="18" stroke="#800020" strokeWidth="4" fill="#F8FAFC"/>
      <circle cx="160" cy="345" r="6" fill="#800020"/>
      <rect x="195" y="337" width="130" height="16" rx="8" fill="#94A3B8"/>
      <rect x="290" y="375" width="120" height="52" rx="16" fill="#800020"/>
      <text x="350" y="410" fontFamily="sans-serif" fontSize="26" fontWeight="900" fill="#FFF" textAnchor="middle" letterSpacing="2">PRO</text>
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Key: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 2l-2 2m-2-2l2 2m-2-2l-7 7m7 7l-7-7m7 7l-2-2m-2 2l2-2M7.5 13.5a4.5 4.5 0 1 1 6.36-6.36 4.5 4.5 0 0 1-6.36 6.36z"></path>
    </svg>
  ),
  ShieldCheck: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  ),
  LogOut: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Tag: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Printer: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  ),
  Sun: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  ),
  Moon: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ),
  Sort: () => (
    <svg className="w-3.5 h-3.5 inline ml-1 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="7 15 12 20 17 15"></polyline>
      <polyline points="7 9 12 4 17 9"></polyline>
    </svg>
  ),
  Phone: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  )
};

// --- LOGIN SCREEN COMPONENT ---
function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("Ponziano");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim();
      if (cleanUser.toLowerCase() === VALID_USERNAME.toLowerCase() && password === VALID_PASSWORD) {
        // Authenticate permanently
        const authData = setPermanentAuth(cleanUser);
        onLoginSuccess(authData);
      } else {
        setIsLoading(false);
        setErrorMessage("Credenziali non corrette. Verifica Username o Password.");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/90 border border-bordeaux-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-bordeaux-800 via-bordeaux-500 to-bordeaux-800"></div>

        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-2xl bg-bordeaux-700/40 blur-xl"></div>
            <img src="./assets/icons/icon.svg" alt="TaskLog Pro" className="relative w-16 h-16 drop-shadow-xl" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Task<span className="text-bordeaux-400">Log</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-bordeaux-800 text-white border border-bordeaux-600">
              PRO
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Accesso Aziendale Riservato
          </p>
        </div>

        {/* Permanent Session Guarantee Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-bordeaux-950/60 border border-bordeaux-800/70 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-bordeaux-900/80 text-bordeaux-300 shrink-0 mt-0.5">
            <Icons.ShieldCheck />
          </div>
          <div className="text-xs">
            <span className="font-bold text-white block">Accesso Permanente Attivo</span>
            <span className="text-[11px] text-slate-300 leading-relaxed block mt-0.5">
              Ti autentichi <strong>una sola volta</strong> e rimani sempre connesso su questo dispositivo (sessione senza scadenza).
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome Utente (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Icons.User />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Inserisci Username"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-medium focus:outline-none focus:border-bordeaux-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Icons.Key />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci Password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-bordeaux-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          {/* Persistent Checkbox (Locked On) */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberForever"
              checked={true}
              readOnly
              className="w-4 h-4 rounded text-bordeaux-600 bg-slate-950 border-slate-700 accent-bordeaux-700 cursor-not-allowed"
            />
            <label htmlFor="rememberForever" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
              Ricorda sessione su questo dispositivo (Nessuna scadenza)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-bordeaux-800 via-bordeaux-700 to-bordeaux-600 hover:from-bordeaux-700 hover:to-bordeaux-500 text-white shadow-xl shadow-bordeaux-950/80 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Icons.Lock />
                <span>Accedi e Rimani Connesso</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
          Credenziali riservate aziendali • TaskLog Pro Enterprise
        </div>
      </div>
    </div>
  );
}

// --- MAIN APPLICATION COMPONENT ---
function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem("tasklog_theme") || "dark");

  // Persistent Auth State
  const [authSession, setAuthSession] = useState(() => getStoredAuth());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Activities state
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem("tasklog_activities");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { console.error(e); }
    }
    return DEFAULT_DEMO_ACTIVITIES;
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("tasklog_activities", JSON.stringify(activities));
  }, [activities]);

  // Apply Theme
  useEffect(() => {
    localStorage.setItem("tasklog_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.remove("bg-slate-50", "text-slate-900");
      document.body.classList.add("bg-slate-950", "text-slate-100");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("bg-slate-950", "text-slate-100");
      document.body.classList.add("bg-slate-50", "text-slate-900");
    }
  }, [theme]);

  // Toast feedback state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "Piattaforma E-Commerce B2B",
    customProject: "",
    title: "",
    category: "Sviluppo & IT",
    hours: 1.0,
    status: "Completata",
    priority: "Media",
    operator: (authSession && authSession.username) ? authSession.username : "Ponziano",
    notes: ""
  });

  // Update operator when auth changes
  useEffect(() => {
    if (authSession && authSession.username) {
      setFormData(prev => ({
        ...prev,
        operator: authSession.username
      }));
    }
  }, [authSession]);

  // Existing Projects list derived from activities
  const projectList = useMemo(() => {
    const set = new Set(activities.map(a => a.project.trim()).filter(Boolean));
    set.add("Piattaforma E-Commerce B2B");
    set.add("CRM Aziendale Custom");
    set.add("Sicurezza & Compliance");
    set.add("App Mobile Logistica");
    return Array.from(set);
  }, [activities]);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all"); // 'all', 'today', 'week', 'month'
  const [filterProject, setFilterProject] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // Sorting state
  const [sortField, setSortField] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals state
  const [viewingActivity, setViewingActivity] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Form reference for auto-scroll on edit
  const formRef = useRef(null);

  // Handle Logout
  const handleLogout = () => {
    clearPermanentAuth();
    setAuthSession(null);
    setShowLogoutConfirm(false);
    showToast("Disconnessione completata.", "info");
  };

  // If not authenticated, render Login Screen
  if (!authSession) {
    return (
      <LoginScreen
        onLoginSuccess={(auth) => {
          setAuthSession(auth);
          showToast(`Benvenuto ${auth.username}! Sessione permanente avviata.`);
        }}
      />
    );
  }

  // Reset or fill form
  const handleEditClick = (act) => {
    setEditingId(act.id);
    setFormData({
      date: act.date,
      project: projectList.includes(act.project) ? act.project : "__custom__",
      customProject: projectList.includes(act.project) ? "" : act.project,
      title: act.title,
      category: act.category,
      hours: act.hours,
      status: act.status,
      priority: act.priority,
      operator: act.operator,
      notes: act.notes || ""
    });
    showToast(`Modifica attività: "${act.title.substring(0, 30)}..."`, "info");
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      project: projectList[0] || "Progetto Generale",
      customProject: "",
      title: "",
      category: "Sviluppo & IT",
      hours: 1.0,
      status: "Completata",
      priority: "Media",
      operator: authSession.username || "Ponziano",
      notes: ""
    });
  };

  const handleDuplicate = (act) => {
    const duplicated = {
      ...act,
      id: "act-" + Date.now(),
      title: act.title + " (Copia)",
      date: new Date().toISOString().split("T")[0]
    };
    setActivities([duplicated, ...activities]);
    showToast("Attività duplicata con successo!");
  };

  const confirmDelete = () => {
    if (!deletingActivity) return;
    setActivities(activities.filter(a => a.id !== deletingActivity.id));
    if (editingId === deletingActivity.id) {
      cancelEdit();
    }
    showToast("Attività rimossa con successo", "error");
    setDeletingActivity(null);
  };

  // Form Submit (Create or Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Inserisci il titolo dell'attività!", "warning");
      return;
    }

    const finalProject = formData.project === "__custom__" 
      ? (formData.customProject.trim() || "Progetto Generale")
      : formData.project;

    if (editingId) {
      // Update
      setActivities(activities.map(a => {
        if (a.id === editingId) {
          return {
            ...a,
            date: formData.date,
            project: finalProject,
            title: formData.title.trim(),
            category: formData.category,
            hours: parseFloat(formData.hours) || 0.5,
            status: formData.status,
            priority: formData.priority,
            operator: formData.operator.trim() || authSession.username,
            notes: formData.notes.trim()
          };
        }
        return a;
      }));
      showToast("Attività aggiornata con successo!");
      cancelEdit();
    } else {
      // Create
      const newAct = {
        id: "act-" + Date.now(),
        date: formData.date,
        project: finalProject,
        title: formData.title.trim(),
        category: formData.category,
        hours: parseFloat(formData.hours) || 0.5,
        status: formData.status,
        priority: formData.priority,
        operator: formData.operator.trim() || authSession.username,
        notes: formData.notes.trim()
      };
      setActivities([newAct, ...activities]);
      showToast("Nuova attività registrata!");
      setFormData(prev => ({
        ...prev,
        title: "",
        notes: "",
        hours: 1.0
      }));
    }
  };

  // Quick adjust hours (+0.25, +0.5, +1, +2, +4)
  const addHours = (delta) => {
    setFormData(prev => ({
      ...prev,
      hours: Math.max(0.25, parseFloat((Number(prev.hours) + delta).toFixed(2)))
    }));
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    
    // Week start (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Month start
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    return activities.filter(act => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchProj = act.project.toLowerCase().includes(q);
        const matchNotes = (act.notes || "").toLowerCase().includes(q);
        const matchOp = act.operator.toLowerCase().includes(q);
        const matchCat = act.category.toLowerCase().includes(q);
        if (!matchTitle && !matchProj && !matchNotes && !matchOp && !matchCat) return false;
      }

      // Period
      if (filterPeriod === "today" && act.date !== todayStr) return false;
      if (filterPeriod === "week" && act.date < weekStartStr) return false;
      if (filterPeriod === "month" && act.date < monthStartStr) return false;

      // Dropdowns
      if (filterProject !== "all" && act.project !== filterProject) return false;
      if (filterCategory !== "all" && act.category !== filterCategory) return false;
      if (filterStatus !== "all" && act.status !== filterStatus) return false;
      if (filterPriority !== "all" && act.priority !== filterPriority) return false;

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === "hours") {
        return sortAsc ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [activities, searchQuery, filterPeriod, filterProject, filterCategory, filterStatus, filterPriority, sortField, sortAsc]);

  // Aggregate KPI Metrics
  const stats = useMemo(() => {
    const totalHours = filteredActivities.reduce((acc, a) => acc + (Number(a.hours) || 0), 0);
    const totalCount = filteredActivities.length;
    const completedCount = filteredActivities.filter(a => a.status === "Completata").length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // Project with highest hours
    const hoursByProject = {};
    filteredActivities.forEach(a => {
      hoursByProject[a.project] = (hoursByProject[a.project] || 0) + Number(a.hours);
    });
    let topProject = "-";
    let maxProjectHours = 0;
    Object.entries(hoursByProject).forEach(([proj, hrs]) => {
      if (hrs > maxProjectHours) {
        maxProjectHours = hrs;
        topProject = proj;
      }
    });

    // Unique active days
    const uniqueDays = new Set(filteredActivities.map(a => a.date)).size;
    const avgHoursPerDay = uniqueDays > 0 ? (totalHours / uniqueDays).toFixed(1) : "0.0";

    return {
      totalHours: totalHours.toFixed(1),
      totalCount,
      completedCount,
      completionRate,
      topProject,
      maxProjectHours: maxProjectHours.toFixed(1),
      avgHoursPerDay
    };
  }, [filteredActivities]);

  // Handle Sort Toggle
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for new sort
    }
  };

  // CSV Export with UTF-8 BOM for Excel
  const exportCSV = () => {
    const headers = ["ID", "Data", "Progetto", "Titolo Attività", "Categoria", "Ore Dedicate", "Stato", "Priorità", "Operatore", "Note"];
    const rows = filteredActivities.map(a => [
      `"${a.id}"`,
      `"${a.date}"`,
      `"${a.project.replace(/"/g, '""')}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.hours}"`,
      `"${a.status}"`,
      `"${a.priority}"`,
      `"${a.operator.replace(/"/g, '""')}"`,
      `"${(a.notes || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TaskLog_Pro_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Report CSV esportato con successo!");
    setShowExportModal(false);
  };

  // JSON Export
  const exportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(activities, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `TaskLog_Pro_Backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    showToast("Backup JSON scaricato!");
    setShowExportModal(false);
  };

  // Helper for Category Badge Color
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Sviluppo & IT":
        return "bg-bordeaux-900/60 text-bordeaux-200 border-bordeaux-700/50";
      case "Consulenza":
        return "bg-indigo-950/60 text-indigo-300 border-indigo-700/50";
      case "Meeting & Sync":
        return "bg-amber-950/60 text-amber-300 border-amber-700/50";
      case "Supporto Clienti":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-700/50";
      case "Revisione & QA":
        return "bg-purple-950/60 text-purple-300 border-purple-700/50";
      case "Amministrazione":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-rose-950/60 text-rose-300 border-rose-700/50";
    }
  };

  // Helper for Status Badge Color
  const getStatusBadge = (st) => {
    switch (st) {
      case "Completata":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "In corso":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "In revisione":
        return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
    }
  };

  // Helper for Priority Badge Color
  const getPriorityBadge = (pr) => {
    switch (pr) {
      case "Urgente":
        return "bg-bordeaux-700 text-white font-bold animate-pulse";
      case "Alta":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/40";
      case "Media":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
      default:
        return "bg-slate-600/20 text-slate-400 border border-slate-600/30";
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-bordeaux-500/40 bg-slate-900/95 text-white transition-all transform animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-bordeaux-500 animate-ping"></div>
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Corporate Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/90 dark:bg-slate-950/90 border-b border-bordeaux-900/40 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Icons.Logo />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white dark:text-white flex items-center">
                  Task<span className="text-bordeaux-400 font-extrabold">Log</span>
                  <span className="ml-1.5 px-2 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-md bg-bordeaux-800 text-white shadow-sm border border-bordeaux-600">
                    PRO
                  </span>
                </h1>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 hidden sm:block">
                Registro Attività & Rendicontazione Aziendale
              </p>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2">
            {/* Authenticated User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-bordeaux-900/50 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-white hidden xs:inline">{authSession.username}</span>
              <span className="text-[10px] text-bordeaux-400 font-semibold uppercase tracking-wider hidden sm:inline">Permanente</span>
            </div>

            <button
              onClick={() => setShowIosGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bordeaux-950/80 hover:bg-bordeaux-900 text-bordeaux-200 border border-bordeaux-800/80 transition shadow-sm"
              title="Come installare su iPhone"
            >
              <Icons.Phone />
              <span className="hidden md:inline">iPhone</span>
            </button>

            <button
              onClick={() => {
                setActivities(DEFAULT_DEMO_ACTIVITIES);
                showToast("Dati demo aziendali ricaricati!");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Carica dati demo di esempio"
            >
              <span className="hidden sm:inline">Dati</span> Demo
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Cambia tema chiaro/scuro"
            >
              {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
            </button>

            {/* Logout button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 transition"
              title="Disconnetti account"
            >
              <Icons.LogOut />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Executive KPI Summary Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 no-print">
          {/* KPI 1: Ore Totali */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/60 dark:from-slate-900/90 dark:to-slate-900/60 border border-bordeaux-900/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Ore Registrate</span>
              <div className="p-2 rounded-xl bg-bordeaux-800/40 text-bordeaux-400 border border-bordeaux-700/30">
                <Icons.Clock />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">{stats.totalHours}</span>
              <span className="text-xs font-bold text-bordeaux-400">ore totali</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Media giornaliera: <strong className="text-slate-200">{stats.avgHoursPerDay} h/giorno</strong>
            </div>
          </div>

          {/* KPI 2: Attività & Avanzamento */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/60 dark:from-slate-900/90 dark:to-slate-900/60 border border-bordeaux-900/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Completamento</span>
              <div className="p-2 rounded-xl bg-bordeaux-800/40 text-bordeaux-400 border border-bordeaux-700/30">
                <Icons.CheckCircle />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">{stats.completionRate}%</span>
              <span className="text-xs text-slate-400 font-medium">({stats.completedCount}/{stats.totalCount})</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-bordeaux-700 to-bordeaux-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* KPI 3: Progetto Principale */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/60 dark:from-slate-900/90 dark:to-slate-900/60 border border-bordeaux-900/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Top Commessa</span>
              <div className="p-2 rounded-xl bg-bordeaux-800/40 text-bordeaux-400 border border-bordeaux-700/30">
                <Icons.Briefcase />
              </div>
            </div>
            <div className="truncate text-base sm:text-lg font-bold text-white mb-1" title={stats.topProject}>
              {stats.topProject}
            </div>
            <div className="text-[11px] text-bordeaux-400 font-semibold">
              {stats.maxProjectHours} ore allocate su questo progetto
            </div>
          </div>

          {/* KPI 4: Operatore & Data Corrente */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/60 dark:from-slate-900/90 dark:to-slate-900/60 border border-bordeaux-900/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Sessione di Lavoro</span>
              <div className="p-2 rounded-xl bg-bordeaux-800/40 text-bordeaux-400 border border-bordeaux-700/30">
                <Icons.User />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-white truncate">
              {authSession.username}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Data: <span className="text-slate-200">{new Date().toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </section>

        {/* Activity Registration Form */}
        <section 
          ref={formRef}
          className="rounded-3xl bg-slate-900/80 dark:bg-slate-900/80 border border-bordeaux-900/50 shadow-2xl p-5 sm:p-7 backdrop-blur-xl no-print"
        >
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-bordeaux-600 shadow-lg shadow-bordeaux-600/50"></div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {editingId ? "Modifica Attività Registrata" : "Registra Nuova Attività Giornaliera"}
              </h2>
            </div>
            {editingId && (
              <button 
                onClick={cancelEdit}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Annulla Modifica
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Row 1: Date, Project Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Data */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Data Attività
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, date: new Date().toISOString().split("T")[0] })}
                    className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-bordeaux-300 border border-slate-700 transition"
                    title="Imposta data a Oggi"
                  >
                    Oggi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, date: new Date(Date.now() - 86400000).toISOString().split("T")[0] })}
                    className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Imposta data a Ieri"
                  >
                    Ieri
                  </button>
                </div>
              </div>

              {/* Progetto / Commessa */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Progetto / Commessa Aziendale
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition"
                  >
                    {projectList.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="__custom__">➕ Altro progetto personalizzato...</option>
                  </select>

                  {formData.project === "__custom__" && (
                    <input
                      type="text"
                      placeholder="Nome nuova commessa..."
                      value={formData.customProject}
                      onChange={(e) => setFormData({ ...formData, customProject: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-bordeaux-600 text-sm text-white focus:outline-none focus:border-bordeaux-400 transition"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Title and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Titolo Attività */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Titolo Sintetico Attività <span className="text-bordeaux-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Sviluppo componente tabella report, Call allineamento cliente..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition placeholder-slate-500"
                />
              </div>

              {/* Categoria */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoria Attività
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Hours, Priority, Status, Operator */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Ore Dedicate con quick button */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ore Dedicate ({formData.hours}h)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    required
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0.25 })}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white font-mono font-bold focus:outline-none focus:border-bordeaux-500 text-center"
                  />
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    <button type="button" onClick={() => addHours(0.25)} className="px-2 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">+15m</button>
                    <button type="button" onClick={() => addHours(0.5)} className="px-2 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">+30m</button>
                    <button type="button" onClick={() => addHours(1.0)} className="px-2 py-1.5 text-xs font-bold rounded-lg bg-bordeaux-950 hover:bg-bordeaux-900 text-bordeaux-200 border border-bordeaux-800 transition">+1h</button>
                    <button type="button" onClick={() => addHours(2.0)} className="px-2 py-1.5 text-xs font-bold rounded-lg bg-bordeaux-950 hover:bg-bordeaux-900 text-bordeaux-200 border border-bordeaux-800 transition">+2h</button>
                  </div>
                </div>
              </div>

              {/* Stato */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Stato Avanzamento
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Priorità */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priorità
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Operatore */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Operatore Assegnatario
                </label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition font-medium"
                />
              </div>
            </div>

            {/* Row 4: Notes and Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Note Dettagliate / Risultati / Note di Consegna (Opzionale)
              </label>
              <textarea
                rows="2"
                placeholder="Dettagli sulle attività svolte, note tecniche, riferimenti a ticket o link documentazione..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-bordeaux-500 transition placeholder-slate-600"
              ></textarea>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Pulisci Campi
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-bordeaux-800 to-bordeaux-600 hover:from-bordeaux-700 hover:to-bordeaux-500 text-white shadow-lg shadow-bordeaux-900/50 hover:shadow-bordeaux-800/80 transition-all transform active:scale-95"
              >
                <Icons.Plus />
                {editingId ? "Salva Modifiche Attività" : "Registra Attività nel Report"}
              </button>
            </div>
          </form>
        </section>

        {/* Organized Tabular Report Section */}
        <section className="rounded-3xl bg-slate-900/80 dark:bg-slate-900/80 border border-bordeaux-900/50 shadow-2xl p-5 sm:p-7 backdrop-blur-xl space-y-5">
          {/* Section Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-bordeaux-800/40 text-bordeaux-400 border border-bordeaux-700/30">
                  <Icons.Tag />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Report Attività Giornaliere
                  </h2>
                  <p className="text-xs text-slate-400">
                    Visualizzazione tabellare organizzata ({filteredActivities.length} di {activities.length} attività)
                  </p>
                </div>
              </div>
            </div>

            {/* Export & Print actions */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-bordeaux-950/80 hover:bg-bordeaux-900 text-bordeaux-200 border border-bordeaux-800 transition shadow-sm"
                title="Esporta foglio Excel / CSV"
              >
                <Icons.Download />
                <span>Esporta CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Stampa o Salva PDF report aziendale"
              >
                <Icons.Printer />
                <span>Stampa / PDF</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Opzioni esportazione avanzate"
              >
                Opzioni Export
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 no-print">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Cerca per titolo, note, progetto o operatore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-bordeaux-500 transition"
              />
            </div>

            {/* Period Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-bordeaux-500 transition"
              >
                <option value="all">Tutto il periodo</option>
                <option value="today">Solo Oggi</option>
                <option value="week">Questa Settimana</option>
                <option value="month">Questo Mese</option>
              </select>
            </div>

            {/* Project Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-bordeaux-500 transition truncate"
              >
                <option value="all">Tutti i Progetti</option>
                {projectList.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-bordeaux-500 transition"
              >
                <option value="all">Tutte le Categorie</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-bordeaux-500 transition"
              >
                <option value="all">Tutti gli Stati</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop & Tablet Tabular View */}
          <div className="table-container hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-bordeaux-950 to-slate-900 border-b border-bordeaux-900/60 text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort("date")}>
                    Data <Icons.Sort />
                  </th>
                  <th scope="col" className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort("project")}>
                    Progetto <Icons.Sort />
                  </th>
                  <th scope="col" className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort("title")}>
                    Attività & Categoria <Icons.Sort />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("hours")}>
                    Ore <Icons.Sort />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("priority")}>
                    Priorità <Icons.Sort />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center cursor-pointer hover:text-white" onClick={() => toggleSort("status")}>
                    Stato <Icons.Sort />
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right no-print">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Icons.Search />
                        <p className="mt-2 font-medium">Nessuna attività trovata con i filtri correnti.</p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setFilterPeriod("all");
                            setFilterProject("all");
                            setFilterCategory("all");
                            setFilterStatus("all");
                          }}
                          className="mt-3 text-xs text-bordeaux-400 hover:underline"
                        >
                          Azzera filtri di ricerca
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr 
                      key={act.id} 
                      className="hover:bg-slate-900/60 transition-colors group"
                    >
                      {/* Data */}
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        {act.date}
                      </td>

                      {/* Progetto */}
                      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                        <span className="inline-block max-w-[180px] truncate" title={act.project}>
                          {act.project}
                        </span>
                      </td>

                      {/* Titolo e Categoria */}
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-medium text-slate-200 group-hover:text-white transition">
                          {act.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadge(act.category)}`}>
                            {act.category}
                          </span>
                          {act.notes && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[220px]" title={act.notes}>
                              📝 {act.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ore */}
                      <td className="px-3 py-3 text-center font-mono font-bold text-bordeaux-300 whitespace-nowrap">
                        {act.hours.toFixed(2)} h
                      </td>

                      {/* Priorità */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${getPriorityBadge(act.priority)}`}>
                          {act.priority}
                        </span>
                      </td>

                      {/* Stato */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(act.status)}`}>
                          {act.status}
                        </span>
                      </td>

                      {/* Azioni */}
                      <td className="px-4 py-3 text-right whitespace-nowrap no-print">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingActivity(act)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="Dettaglio completo"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            onClick={() => handleEditClick(act)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-bordeaux-300 transition"
                            title="Modifica attività"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() => handleDuplicate(act)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="Duplica"
                          >
                            <Icons.Copy />
                          </button>
                          <button
                            onClick={() => setDeletingActivity(act)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                            title="Elimina"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Feed (Optimized for iPhone Screens) */}
          <div className="md:hidden space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-950/60 text-slate-400">
                <Icons.Search />
                <p className="mt-2 text-xs font-medium">Nessuna attività trovata.</p>
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div 
                  key={act.id} 
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{act.date}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getPriorityBadge(act.priority)}`}>
                      {act.priority}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{act.title}</h3>
                    <p className="text-xs font-semibold text-bordeaux-400 mt-0.5">{act.project}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadge(act.category)}`}>
                      {act.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(act.status)}`}>
                      {act.status}
                    </span>
                    <span className="ml-auto text-xs font-mono font-bold text-bordeaux-300">
                      {act.hours.toFixed(2)} ore
                    </span>
                  </div>

                  {act.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                      {act.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60 no-print">
                    <button
                      onClick={() => setViewingActivity(act)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => handleEditClick(act)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-bordeaux-950 text-bordeaux-300 border border-bordeaux-800"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDuplicate(act)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300"
                    >
                      Duplica
                    </button>
                    <button
                      onClick={() => setDeletingActivity(act)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tabular Subtotal Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-400 border-t border-slate-800">
            <div>
              Attività visualizzate: <strong className="text-white">{filteredActivities.length}</strong> (su {activities.length} totali)
            </div>
            <div className="flex items-center gap-4">
              <span>Totale ore selezione: <strong className="text-bordeaux-400 text-sm font-mono font-bold">{stats.totalHours} h</strong></span>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL: Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-bordeaux-800/80 shadow-2xl text-white text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Icons.LogOut />
            </div>
            <h3 className="text-base font-bold">Vuoi davvero disconnetterti?</h3>
            <p className="text-xs text-slate-400">
              La sessione permanente verrà interrotta su questo dispositivo e dovrai reinserire password e username al prossimo accesso.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
              >
                Disconnetti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Activity Detail */}
      {viewingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-bordeaux-800 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-bordeaux-400 uppercase tracking-wider">Scheda Attività • TaskLog Pro</span>
              <button 
                onClick={() => setViewingActivity(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-xs font-semibold text-bordeaux-400">{viewingActivity.project}</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{viewingActivity.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Data Esecuzione</span>
                <span className="font-mono font-semibold">{viewingActivity.date}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Tempo Impiegato</span>
                <span className="font-mono font-bold text-bordeaux-300">{viewingActivity.hours.toFixed(2)} ore</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Stato</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(viewingActivity.status)}`}>
                  {viewingActivity.status}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Priorità</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityBadge(viewingActivity.priority)}`}>
                  {viewingActivity.priority}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Operatore Assegnatario</span>
              <span className="font-semibold text-white">{viewingActivity.operator}</span>
            </div>

            {viewingActivity.notes && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">Note e Consegne</span>
                <p className="text-slate-200 whitespace-pre-wrap">{viewingActivity.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => {
                  handleEditClick(viewingActivity);
                  setViewingActivity(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-bordeaux-800 hover:bg-bordeaux-700 text-white"
              >
                Modifica
              </button>
              <button 
                onClick={() => setViewingActivity(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete */}
      {deletingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-900/60 shadow-2xl text-white space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Icons.Trash />
            </div>
            <h3 className="text-base font-bold">Confermi l'eliminazione dell'attività?</h3>
            <p className="text-xs text-slate-400">
              L'attività "<strong>{deletingActivity.title}</strong>" verrà rimossa definitivamente dal registro.
            </p>
            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setDeletingActivity(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Annulla
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
              >
                Elimina Attività
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Advanced Export */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-bordeaux-800 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Opzioni Esportazione Report</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={exportCSV}
                className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-bordeaux-950/60 border border-slate-800 hover:border-bordeaux-700 flex items-center gap-3 text-left transition"
              >
                <div className="p-2.5 rounded-xl bg-bordeaux-900 text-white">
                  <Icons.Download />
                </div>
                <div>
                  <div className="text-xs font-bold">Esporta come CSV / Excel</div>
                  <div className="text-[11px] text-slate-400">Compatibile con Microsoft Excel, Google Fogli e Apple Numbers</div>
                </div>
              </button>

              <button
                onClick={exportJSON}
                className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition"
              >
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                  <Icons.Copy />
                </div>
                <div>
                  <div className="text-xs font-bold">Salva Backup JSON Completo</div>
                  <div className="text-[11px] text-slate-400">Consente il ripristino o la migrazione di tutte le attività</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  window.print();
                }}
                className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition"
              >
                <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                  <Icons.Printer />
                </div>
                <div>
                  <div className="text-xs font-bold">Stampa / Esporta in PDF</div>
                  <div className="text-[11px] text-slate-400">Layout cartaceo formattato per direzione o archivio aziendale</div>
                </div>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: iOS / iPhone Installation Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-bordeaux-800 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icons.Phone />
                <h3 className="text-base font-bold">Come installare TaskLog Pro su iPhone</h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-bordeaux-950/60 border border-bordeaux-800/60">
                <p className="font-semibold text-bordeaux-200">
                  Grazie al supporto PWA, puoi usare TaskLog Pro come una vera applicazione iOS a schermo intero senza barre del browser!
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-bordeaux-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Apri il link dell'applicazione (o la pagina GitHub Pages) in <strong>Safari</strong> sul tuo iPhone.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-bordeaux-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Tocca l'icona <strong>Condividi</strong> in basso (il quadrato con la freccia verso l'alto ⎋).</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-bordeaux-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Scorri e seleziona <strong>"Aggiungi alla schermata Home" ➕</strong>.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-bordeaux-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                  <span>Tocca <strong>"Aggiungi"</strong> in alto a destra: l'icona bordeaux apparirà sulla tua Home!</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowIosGuide(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-bordeaux-800 hover:bg-bordeaux-700 text-white"
              >
                Ho capito!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400 no-print">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-bordeaux-500"></span>
          <span className="font-semibold text-slate-300">TaskLog Pro Enterprise</span>
          <span>•</span>
          <span>Sessione Permanente: {authSession.username}</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Progettato con palette Bordeaux Corporate per Gabriele Ponziano
        </p>
      </footer>
    </div>
  );
}

// Mount the React Application
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

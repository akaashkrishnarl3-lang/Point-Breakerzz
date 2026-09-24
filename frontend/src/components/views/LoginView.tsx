import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { saveDemoSession, createDemoUser } from '../../services/demoSession';
import { User } from '../../types';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Info,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadingMessage, setLoadingMessage] = useState<string>('Authenticating...');
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  // 1. Firebase Google OAuth Pop-up Flow
  const handleGoogleSignInClick = async () => {
    if (authStatus === 'loading') return;

    setLoadingMessage('Opening Google authentication popup...');
    setAuthStatus('loading');
    setAlertMessage(null);

    try {
      if (!auth || !googleProvider) {
        console.error('[MeetFlow AI Firebase Auth] auth or googleProvider not initialized.');
        setAuthStatus('error');
        setAlertMessage({
          type: 'error',
          text: 'Google authentication service is initializing. Please try again or use email sign in.'
        });
        return;
      }

      console.log('[MeetFlow AI Firebase Auth] Launching signInWithPopup for project meetflow-ai-90732...');
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      console.log('[MeetFlow AI Firebase Auth] Success! User:', firebaseUser.email, 'UID:', firebaseUser.uid);

      setLoadingMessage('Verifying credentials with MeetFlow AI backend...');
      const idToken = await firebaseUser.getIdToken();

      const result = await ApiService.loginWithGoogle(idToken);
      console.log('[MeetFlow AI Auth] Backend session created successfully for:', result.user.email);

      setAuthStatus('success');
      setTimeout(() => {
        onLoginSuccess(result.user);
      }, 400);
    } catch (err: any) {
      console.error('[MeetFlow AI Firebase Auth Error]: Code:', err.code, 'Message:', err.message, err);
      setAuthStatus('error');

      if (err.code === 'auth/popup-closed-by-user') {
        setAlertMessage({
          type: 'info',
          text: 'Google sign-in popup was closed before completing. Please try again.'
        });
      } else if (err.code === 'auth/popup-blocked') {
        setAlertMessage({
          type: 'error',
          text: 'Sign-in popup was blocked by your browser. Please allow popups for localhost.'
        });
      } else if (err.code === 'auth/unauthorized-domain') {
        setAlertMessage({
          type: 'error',
          text: 'Domain "localhost" is not authorized in Firebase Console. Add localhost under Authentication → Settings → Authorized domains.'
        });
      } else if (err.code === 'auth/operation-not-allowed') {
        setAlertMessage({
          type: 'error',
          text: 'Google sign-in provider is not enabled in Firebase Console. Please enable it under Authentication → Sign-in method.'
        });
      } else if (err.code === 'auth/invalid-api-key') {
        setAlertMessage({
          type: 'error',
          text: 'Firebase API Key is invalid. Please verify VITE_FIREBASE_API_KEY in frontend/.env.'
        });
      } else {
        setAlertMessage({
          type: 'error',
          text: err.message ? `Google authentication failed: ${err.message}` : 'Google sign-in failed. Please try again.'
        });
      }
    }
  };

  // 2. Demo User Instant Login (100% Frontend-Local, Zero Network / Backend Dependency)
  const handleDemoSignIn = () => {
    if (authStatus === 'loading') return;

    setAlertMessage(null);
    setLoadingMessage('Opening demo dashboard...');
    setAuthStatus('loading');

    try {
      console.log('[MeetFlow AI] Initializing local demo session...');
      // 1. Store demo session safely in localStorage under 'meetflow_demo_session'
      saveDemoSession();

      // 2. Create authenticated demo user profile
      const demoUser = createDemoUser();
      console.log('[MeetFlow AI] Local demo session active for:', demoUser.email);

      setAuthStatus('success');
      // 3. Immediately trigger authenticated callback to navigate directly to dashboard
      onLoginSuccess(demoUser);
    } catch (err: any) {
      console.error('[MeetFlow AI Demo Auth Error]:', err);
      setAuthStatus('error');
      setAlertMessage({
        type: 'error',
        text: 'Failed to initialize local demo session. Please try again.'
      });
    }
  };

  // 3. Form Submit: Login or Register Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setAlertMessage({
          type: 'error',
          text: 'Please enter your full name.'
        });
        return;
      }
      if (!email.trim() || !password.trim()) {
        setAlertMessage({
          type: 'error',
          text: 'Please enter both your email address and password.'
        });
        return;
      }
      if (password.length < 6) {
        setAlertMessage({
          type: 'error',
          text: 'Password must be at least 6 characters long.'
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await ApiService.registerWithEmail(name.trim(), email.trim(), password);
        setAuthStatus('success');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 400);
      } catch (err: any) {
        setAlertMessage({
          type: 'error',
          text: err.message || 'Failed to create account. Please try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setAlertMessage({
          type: 'error',
          text: 'Please enter both your email address and password.'
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await ApiService.loginWithEmail(email.trim(), password);
        setAuthStatus('success');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 400);
      } catch (err: any) {
        setAlertMessage({
          type: 'error',
          text: err.message || 'Invalid email or password. Please check your credentials.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 4. Forgot Password Link
  const handleForgotPassword = () => {
    setAlertMessage({
      type: 'info',
      text: 'To reset your credentials, please sign in with your verified Google account or contact your team admin.'
    });
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#0A0D14] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] px-4 py-8 relative overflow-hidden select-none">
      {/* Decorative ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[450px] relative z-10">
        {/* Main SaaS Card */}
        <div className="bg-[#0D121F]/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/80 text-center transition-all duration-300">
          
          {/* Top Brand Area */}
          <div className="flex flex-col items-center">
            {/* MeetFlow AI Shield Logo */}
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 mb-4 animate-in fade-in zoom-in duration-300">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5 transition-all">
              {mode === 'signup' ? 'Create your Account' : 'Welcome to MeetFlow AI'}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mb-6">
              {mode === 'signup' 
                ? 'Join MeetFlow AI to track decisions and action items automatically.' 
                : 'Turn every meeting into action and accountability.'}
            </p>
          </div>

          {/* Feedback & Alert Messages */}
          {authStatus === 'loading' && (
            <div className="mb-5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center gap-2.5 animate-pulse text-xs font-medium text-indigo-200">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <span>{loadingMessage}</span>
            </div>
          )}

          {authStatus === 'success' && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center gap-2.5 text-xs font-semibold text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{mode === 'signup' ? 'Account created successfully' : 'Login successful'}</span>
            </div>
          )}

          {alertMessage && authStatus !== 'loading' && authStatus !== 'success' && (
            <div
              className={`mb-5 p-3 rounded-xl text-left flex items-start gap-2.5 text-xs ${
                alertMessage.type === 'error'
                  ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200'
                  : 'bg-indigo-950/40 border border-indigo-800/50 text-indigo-200'
              }`}
            >
              {alertMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed flex-1">{alertMessage.text}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Full Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div className="animate-in fade-in duration-200">
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={authStatus === 'loading' || isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-60"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authStatus === 'loading' || isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-60"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
                {mode === 'signup' && (
                  <span className="text-[11px] text-slate-500">Min. 6 characters</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authStatus === 'loading' || isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-60"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password Link (Sign In Only) */}
              {mode === 'signin' && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || authStatus === 'loading'}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider 1: OR */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute px-3 bg-[#0D121F] text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              OR
            </span>
          </div>

          {/* Button 2: Continue with Google (Firebase Web Auth) */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={authStatus === 'loading'}
            className="w-full h-11 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 group"
          >
            {/* Official Google G Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-medium text-slate-200 group-hover:text-white">
              Continue with Google
            </span>
          </button>

          {/* Divider 2: OR */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute px-3 bg-[#0D121F] text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              OR
            </span>
          </div>

          {/* Button 3: Continue with Demo */}
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={authStatus === 'loading'}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-cyan-500/10 hover:from-amber-500/20 hover:via-indigo-500/20 hover:to-cyan-500/20 border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-200 hover:text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Continue with Demo</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
              Instant
            </span>
          </button>

          {/* Mode Switch Section */}
          <div className="mt-5 text-center text-xs text-slate-400">
            {mode === 'signup' ? (
              <>
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setAlertMessage(null);
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                <span>New to MeetFlow AI? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setAlertMessage(null);
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                >
                  Create an account
                </button>
              </>
            )}
          </div>

          {/* Security Message */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure 256-bit encrypted authentication</span>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-xs text-slate-600">
          MeetFlow AI • Turn Every Meeting Into Action
        </div>
      </div>
    </div>
  );
};

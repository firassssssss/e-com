"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import api from "@/lib/api";

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, loading } = useAuthStore();
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState("");
  const [step, setStep]               = useState<"credentials" | "otp">("credentials");
  const [otp, setOtp]                 = useState("");
  const [otpLoading, setOtpLoading]   = useState(false);
  const [attempts, setAttempts]       = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown]     = useState(0);

  // Keep credentials in memory only — never touch localStorage until OTP passes
  const pendingEmail    = useRef("");
  const pendingPassword = useRef("");
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // ── Lockout timer ────────────────────────────────────────────────────────
  const startLockout = () => {
    const until = Date.now() + LOCKOUT_SECONDS * 1000;
    setLockedUntil(until);
    setCountdown(LOCKOUT_SECONDS);
    countdownRef.current = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        setLockedUntil(null);
        setAttempts(0);
        setCountdown(0);
        setError("");
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  // ── Step 1: validate password, sign out immediately, send OTP ────────────
  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      // Authenticate to verify credentials
      await login(data.email, data.password);
      // Immediately revoke the session — OTP not done yet
      await logout();
      // Keep credentials in memory for step 2 re-login
      pendingEmail.current    = data.email;
      pendingPassword.current = data.password;
      // Send OTP
      await api.post("/api/auth/email-otp/send-verification-otp", {
        email: data.email,
        type: "sign-in",
      });
      setAttempts(0);
      setStep("otp");
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  };

  // ── Step 2: verify OTP then re-login ─────────────────────────────────────
  const onVerifyOtp = async () => {
    // Lockout check
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Too many attempts. Try again in ${countdown}s.`);
      return;
    }
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }

    setError("");
    setOtpLoading(true);
    try {
      // Verify OTP via better-auth
      await api.post("/api/auth/sign-in/email-otp", {
        email: pendingEmail.current,
        otp,
      });
      // OTP passed — now create the real session
      await login(pendingEmail.current, pendingPassword.current);
      // Clear sensitive refs
      pendingEmail.current    = "";
      pendingPassword.current = "";
      router.push("/");
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        startLockout();
        setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS}s.`);
      } else {
        setError(`Invalid or expired code. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`);
      }
    } finally {
      setOtpLoading(false);
      setOtp("");
    }
  };

  const resendOtp = async () => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    setError("");
    setAttempts(0);
    await api.post("/api/auth/email-otp/send-verification-otp", {
      email: pendingEmail.current,
      type: "sign-in",
    });
  };

  const goBack = () => {
    // Clear everything sensitive
    pendingEmail.current    = "";
    pendingPassword.current = "";
    setOtp("");
    setAttempts(0);
    setLockedUntil(null);
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setError("");
    setStep("credentials");
  };

  const isLocked = !!(lockedUntil && Date.now() < lockedUntil);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

      {/* ─── Left: Hero panel (unchanged) ─── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `url('/images/hero-cyan-dark.jpg') center/cover no-repeat`,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '4rem',
      }} className="hidden md:flex">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(7,5,10,0.85) 0%, rgba(7,5,10,0.5) 50%, rgba(7,5,10,0.8) 100%)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '60%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.85rem', letterSpacing: '0.3em', fontWeight: 700, color: '#fff' }}>
              LUM<span style={{ color: '#00FFFF' }}>I</span>NA
            </p>
          </Link>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <blockquote style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', fontWeight: 300, fontStyle: 'italic', color: '#fff', lineHeight: 1.3, marginBottom: '1.5rem' }}>
            "Your skin tells<br />your story."
          </blockquote>
          <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Science-backed skincare for every skin type.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {["Hydrating", "Brightening", "Anti-aging", "Sensitive"].map((tag) => (
            <span key={tag} style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Right: Form ─── */}
      <div style={{ background: '#07050A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.85rem', letterSpacing: '0.3em', fontWeight: 700, color: '#fff' }}>
                LUM<span style={{ color: '#00FFFF' }}>I</span>NA
              </p>
            </Link>
          </div>

          {/* ══ STEP 1: credentials ══════════════════════════════════════ */}
          {step === "credentials" && (
            <>
              <div style={{ marginBottom: '2.5rem' }}>
                <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#00FFFF', marginBottom: '0.75rem', opacity: 0.8 }}>Welcome back</p>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', fontWeight: 300, color: '#fff', lineHeight: 1.1 }}>Sign in</h1>
              </div>

              {error && (
                <div style={{ background: 'rgba(255,95,31,0.08)', border: '1px solid rgba(255,95,31,0.3)', color: '#F89880', padding: '0.9rem 1.2rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.5rem' }}>Email address</label>
                  <input {...register("email")} type="email" placeholder="you@example.com" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: errors.email ? '1px solid rgba(255,95,31,0.6)' : '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem', padding: '1rem 1.2rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.3s' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)')}
                    onBlur={e => (e.currentTarget.style.borderColor = errors.email ? 'rgba(255,95,31,0.6)' : 'rgba(255,255,255,0.06)')} />
                  {errors.email && <p style={{ fontSize: '0.75rem', color: '#F89880', marginTop: '0.4rem' }}>{errors.email.message}</p>}
                </div>

                <div>
                  <label style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input {...register("password")} type={showPass ? "text" : "password"} placeholder="••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: errors.password ? '1px solid rgba(255,95,31,0.6)' : '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem', padding: '1rem 3rem 1rem 1.2rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.3s' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = errors.password ? 'rgba(255,95,31,0.6)' : 'rgba(255,255,255,0.06)')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.3s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#00FFFF')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ fontSize: '0.75rem', color: '#F89880', marginTop: '0.4rem' }}>{errors.password.message}</p>}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <Link href="/auth/forgot-password" style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.3s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#00FFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', background: '#FF5F1F', border: 'none', color: '#000', fontFamily: "'Syncopate', sans-serif", fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 0 40px rgba(255,95,31,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>
                Don't have an account?{" "}
                <Link href="/auth/register" style={{ color: '#F89880', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF5F1F')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#F89880')}>
                  Create one
                </Link>
              </p>
            </>
          )}

          {/* ══ STEP 2: OTP ══════════════════════════════════════════════ */}
          {step === "otp" && (
            <>
              <div style={{ marginBottom: '2.5rem' }}>
                <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#00FFFF', marginBottom: '0.75rem', opacity: 0.8 }}>Verification</p>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', fontWeight: 300, color: '#fff', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                  Check your email
                </h1>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <span style={{ color: '#00FFFF' }}>{pendingEmail.current}</span>
                </p>
              </div>

              {/* Attempt indicator */}
              {attempts > 0 && !isLocked && (
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '3px', background: i < attempts ? 'rgba(255,95,31,0.8)' : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
              )}

              {error && (
                <div style={{ background: isLocked ? 'rgba(255,0,0,0.08)' : 'rgba(255,95,31,0.08)', border: `1px solid ${isLocked ? 'rgba(255,0,0,0.3)' : 'rgba(255,95,31,0.3)'}`, color: '#F89880', padding: '0.9rem 1.2rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontFamily: "'Syncopate', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.5rem' }}>Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    disabled={isLocked}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    style={{ width: '100%', background: isLocked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: isLocked ? 'rgba(255,255,255,0.2)' : '#fff', fontSize: '1.5rem', padding: '1rem 1.2rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5em', textAlign: 'center', transition: 'border-color 0.3s', cursor: isLocked ? 'not-allowed' : 'text' }}
                    onFocus={e => { if (!isLocked) e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)' }}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                  />
                </div>

                <button onClick={onVerifyOtp} disabled={otpLoading || isLocked} style={{ width: '100%', background: isLocked ? 'rgba(255,95,31,0.3)' : '#FF5F1F', border: 'none', color: '#000', fontFamily: "'Syncopate', sans-serif", fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1.1rem', cursor: (otpLoading || isLocked) ? 'not-allowed' : 'pointer', opacity: (otpLoading || isLocked) ? 0.5 : 1, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onMouseEnter={e => { if (!otpLoading && !isLocked) e.currentTarget.style.boxShadow = '0 0 40px rgba(255,95,31,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
                  {otpLoading ? <Loader2 size={16} className="animate-spin" /> : isLocked ? `Locked — ${countdown}s` : "Verify & Continue"}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', transition: 'color 0.3s', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                    ← Back
                  </button>
                  <button onClick={resendOtp} disabled={isLocked} style={{ background: 'none', border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer', fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: isLocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', transition: 'color 0.3s', padding: 0 }}
                    onMouseEnter={e => { if (!isLocked) e.currentTarget.style.color = '#00FFFF' }}
                    onMouseLeave={e => { if (!isLocked) e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
                    Resend code
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
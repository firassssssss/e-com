// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { authApi } from "@/lib/api";
// import { TextField, Button, CircularProgress, Alert } from "@mui/material";
// import { Eye, EyeOff } from "lucide-react";

// const schema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Invalid email address"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// type FormData = z.infer<typeof schema>;

// export default function RegisterPage() {
//   const router = useRouter();
//   const [showPass, setShowPass] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<FormData>({
//     resolver: zodResolver(schema),
//   });

//   const onSubmit = async (data: FormData) => {
//     setError("");
//     setLoading(true);
//     try {
//       await authApi.register(data);
//       router.push("/auth/login?registered=true");
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Registration failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen grid md:grid-cols-2">
//       {/* Left — decorative panel (identical to login) */}
//       <div className="hidden md:flex flex-col justify-between bg-[#1A1410] p-14 relative overflow-hidden">
//         <div className="absolute inset-0">
//           <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C4786A]/10 blur-3xl translate-x-1/2 -translate-y-1/2" />
//           <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#6B4F3A]/20 blur-3xl -translate-x-1/2 translate-y-1/2" />
//           <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 600 800">
//             <line x1="0" y1="200" x2="600" y2="200" stroke="#E8C4B8" strokeWidth="0.5" />
//             <line x1="0" y1="400" x2="600" y2="400" stroke="#E8C4B8" strokeWidth="0.5" />
//             <line x1="0" y1="600" x2="600" y2="600" stroke="#E8C4B8" strokeWidth="0.5" />
//             <line x1="200" y1="0" x2="200" y2="800" stroke="#E8C4B8" strokeWidth="0.5" />
//             <line x1="400" y1="0" x2="400" y2="800" stroke="#E8C4B8" strokeWidth="0.5" />
//           </svg>
//         </div>

//         <div className="relative z-10">
//           <Link href="/" className="font-display text-3xl font-light tracking-widest text-[#FAF7F2]">
//             Lumière
//           </Link>
//         </div>

//         <div className="relative z-10">
//           <blockquote className="font-display text-4xl font-light text-[#FAF7F2] leading-snug mb-6">
//             "Begin your<br />beauty journey."
//           </blockquote>
//           <p className="text-[#E8C4B8]/60 text-sm tracking-wider">
//             Personalized recommendations await.
//           </p>
//         </div>

//         <div className="relative z-10 flex gap-3">
//           {["Hydrating", "Brightening", "Anti-aging", "Sensitive"].map((tag) => (
//             <span key={tag} className="text-xs tracking-widest text-[#E8C4B8]/50 border border-[#E8C4B8]/20 px-3 py-1">
//               {tag}
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* Right — registration form */}
//       <div className="flex items-center justify-center px-6 py-16 bg-[#FAF7F2]">
//         <div className="w-full max-w-[400px]">
//           {/* Mobile logo */}
//           <div className="md:hidden text-center mb-10">
//             <Link href="/" className="font-display text-3xl font-light tracking-widest text-[#1A1410]">
//               Lumière
//             </Link>
//           </div>

//           <div className="animate-fade-up">
//             <h1 className="font-display text-4xl font-light text-[#1A1410] mb-2">
//               Create account
//             </h1>
//             <p className="text-[#6B4F3A]/70 text-sm tracking-wide mb-10">
//               Join Lumière for personalized beauty
//             </p>
//           </div>

//           {error && (
//             <Alert severity="error" className="mb-6 animate-fade-up" sx={{ borderRadius: 1 }}>
//               {error}
//             </Alert>
//           )}

//           <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
//             <div className="animate-fade-up delay-100">
//               <TextField
//                 {...register("name")}
//                 label="Full name"
//                 type="text"
//                 fullWidth
//                 variant="outlined"
//                 error={!!errors.name}
//                 helperText={errors.name?.message}
//                 size="medium"
//               />
//             </div>

//             <div className="animate-fade-up delay-200">
//               <TextField
//                 {...register("email")}
//                 label="Email address"
//                 type="email"
//                 fullWidth
//                 variant="outlined"
//                 error={!!errors.email}
//                 helperText={errors.email?.message}
//               />
//             </div>

//             <div className="animate-fade-up delay-200 relative">
//               <TextField
//                 {...register("password")}
//                 label="Password"
//                 type={showPass ? "text" : "password"}
//                 fullWidth
//                 variant="outlined"
//                 error={!!errors.password}
//                 helperText={errors.password?.message}
//                 InputProps={{
//                   endAdornment: (
//                     <button
//                       type="button"
//                       onClick={() => setShowPass(!showPass)}
//                       className="text-[#6B4F3A]/50 hover:text-[#C4786A] transition-colors p-1"
//                     >
//                       {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
//                     </button>
//                   ),
//                 }}
//               />
//             </div>

//             <div className="animate-fade-up delay-300 mt-2">
//               <Button
//                 type="submit"
//                 variant="contained"
//                 fullWidth
//                 size="large"
//                 disabled={loading}
//                 sx={{
//                   py: 1.5,
//                   bgcolor: "#1A1410",
//                   "&:hover": { bgcolor: "#C4786A" },
//                   transition: "background-color 0.3s ease",
//                   letterSpacing: "0.12em",
//                   fontSize: "0.8rem",
//                 }}
//               >
//                 {loading ? (
//                   <CircularProgress size={20} sx={{ color: "#FAF7F2" }} />
//                 ) : (
//                   "SIGN UP"
//                 )}
//               </Button>
//             </div>
//           </form>

//           <div className="animate-fade-up delay-400 mt-8 text-center">
//             <div className="flex items-center gap-4 mb-8">
//               <div className="flex-1 h-px bg-[#E0D5C8]" />
//               <span className="text-xs text-[#6B4F3A]/40 tracking-widest">OR</span>
//               <div className="flex-1 h-px bg-[#E0D5C8]" />
//             </div>

//             <p className="text-sm text-[#6B4F3A]/70">
//               Already have an account?{" "}
//               <Link href="/auth/login" className="text-[#C4786A] font-medium hover:underline">
//                 Sign in
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

const schema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    setLoading(true);
    try {
      await authApi.register(data);
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

      {/* ─── Left: Hero panel (amber) ─── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `url('/images/hero-amber-side.jpg') center/cover no-repeat`,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '4rem',
      }} className="hidden md:flex">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(7,5,10,0.85) 0%, rgba(7,5,10,0.45) 50%, rgba(7,5,10,0.8) 100%)',
        }} />

        {/* Amber glow */}
        <div style={{
          position: 'absolute', bottom: '20%', right: '20%',
          width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(255,95,31,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: '0.85rem', letterSpacing: '0.3em',
              fontWeight: 700, color: '#fff',
            }}>
              LUM<span style={{ color: '#00FFFF' }}>I</span>NA
            </p>
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <blockquote style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
            fontWeight: 300, fontStyle: 'italic',
            color: '#fff', lineHeight: 1.3, marginBottom: '1.5rem',
          }}>
            "Begin your<br />beauty journey."
          </blockquote>
          <p style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: '0.55rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
          }}>
            Personalized recommendations await.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {["Hydrating", "Brightening", "Anti-aging", "Sensitive"].map((tag) => (
            <span key={tag} style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: '0.5rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.4rem 0.8rem',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Right: Register form ─── */}
      <div style={{
        background: '#07050A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '3rem 2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <p style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.85rem', letterSpacing: '0.3em',
                fontWeight: 700, color: '#fff',
              }}>
                LUM<span style={{ color: '#00FFFF' }}>I</span>NA
              </p>
            </Link>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: '0.55rem', letterSpacing: '0.3em',
              textTransform: 'uppercase', color: '#FF5F1F',
              marginBottom: '0.75rem', opacity: 0.8,
            }}>
              Begin your ritual
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '3rem', fontWeight: 300,
              color: '#fff', lineHeight: 1.1,
            }}>
              Create account
            </h1>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,95,31,0.08)',
              border: '1px solid rgba(255,95,31,0.3)',
              color: '#F89880', padding: '0.9rem 1.2rem',
              fontSize: '0.85rem', marginBottom: '1.5rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Name */}
            <div>
              <label style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.55rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                display: 'block', marginBottom: '0.5rem',
              }}>
                Full name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Your name"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: errors.name ? '1px solid rgba(255,95,31,0.6)' : '1px solid rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: '0.9rem',
                  padding: '1rem 1.2rem', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.3s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = errors.name ? 'rgba(255,95,31,0.6)' : 'rgba(255,255,255,0.06)')}
              />
              {errors.name && <p style={{ fontSize: '0.75rem', color: '#F89880', marginTop: '0.4rem' }}>{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.55rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                display: 'block', marginBottom: '0.5rem',
              }}>
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: errors.email ? '1px solid rgba(255,95,31,0.6)' : '1px solid rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: '0.9rem',
                  padding: '1rem 1.2rem', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.3s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = errors.email ? 'rgba(255,95,31,0.6)' : 'rgba(255,255,255,0.06)')}
              />
              {errors.email && <p style={{ fontSize: '0.75rem', color: '#F89880', marginTop: '0.4rem' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.55rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                display: 'block', marginBottom: '0.5rem',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: errors.password ? '1px solid rgba(255,95,31,0.6)' : '1px solid rgba(255,255,255,0.06)',
                    color: '#fff', fontSize: '0.9rem',
                    padding: '1rem 3rem 1rem 1.2rem', outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = errors.password ? 'rgba(255,95,31,0.6)' : 'rgba(255,255,255,0.06)')}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '1rem', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: '0.75rem', color: '#F89880', marginTop: '0.4rem' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: '#FF5F1F', border: 'none',
                color: '#000',
                fontFamily: "'Syncopate', sans-serif",
                fontSize: '0.65rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', padding: '1.1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 0 40px rgba(255,95,31,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{
              fontFamily: "'Syncopate', sans-serif", fontSize: '0.5rem',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
            }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{
              color: '#F89880', textDecoration: 'none',
              fontWeight: 500, transition: 'color 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF5F1F')}
            onMouseLeave={e => (e.currentTarget.style.color = '#F89880')}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
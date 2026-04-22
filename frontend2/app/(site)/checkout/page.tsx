// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { TextField } from "@mui/material";
// import { Check, Lock, ArrowLeft } from "lucide-react";

// const schema = z.object({
//   firstName: z.string().min(1, "Required"),
//   lastName: z.string().min(1, "Required"),
//   email: z.string().email("Invalid email"),
//   phone: z.string().min(8, "Invalid phone"),
//   address: z.string().min(5, "Required"),
//   city: z.string().min(1, "Required"),
//   country: z.string().min(1, "Required"),
//   zip: z.string().min(3, "Required"),
//   cardNumber: z.string().min(16, "Invalid card number"),
//   expiry: z.string().min(5, "Invalid expiry"),
//   cvv: z.string().min(3, "Invalid CVV"),
// });

// type FormData = z.infer<typeof schema>;

// // Mock order summary
// const ORDER = {
//   items: [
//     { name: "Radiance Serum", size: "30ml", qty: 1, price: 68, bg: "#E8C4B8" },
//     { name: "Barrier Cream", size: "50ml", qty: 2, price: 54, bg: "#D4C5B5" },
//   ],
//   subtotal: 176,
//   shipping: 0,
//   total: 176,
// };

// export default function CheckoutPage() {
//   const router = useRouter();
//   const [step, setStep] = useState<"shipping" | "payment">("shipping");
//   const [placing, setPlacing] = useState(false);

//   const { register, handleSubmit, formState: { errors }, trigger } = useForm<FormData>({
//     resolver: zodResolver(schema),
//   });

//   const handleNextStep = async () => {
//     const valid = await trigger(["firstName", "lastName", "email", "phone", "address", "city", "country", "zip"]);
//     if (valid) setStep("payment");
//   };

//   const onSubmit = async (data: FormData) => {
//     setPlacing(true);
//     // TODO: call ordersApi.create(data)
//     await new Promise((r) => setTimeout(r, 1500));
//     router.push("/checkout/success");
//   };

//   return (
//     <div className="min-h-screen bg-[#FAF7F2]">
//       <div className="max-w-6xl mx-auto px-6 py-14">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-12">
//           <Link href="/" className="font-display text-2xl font-light tracking-widest text-[#1A1410]">Lumière</Link>
//           <div className="flex items-center gap-2 text-xs text-[#6B4F3A]/50">
//             <Lock size={12} /> Secure checkout
//           </div>
//         </div>

//         {/* Steps */}
//         <div className="flex items-center gap-4 mb-12">
//           {["Shipping", "Payment"].map((s, i) => {
//             const active = (i === 0 && step === "shipping") || (i === 1 && step === "payment");
//             const done = i === 0 && step === "payment";
//             return (
//               <div key={s} className="flex items-center gap-3">
//                 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${done ? "bg-[#8A9E8A] text-white" : active ? "bg-[#1A1410] text-[#FAF7F2]" : "border border-[#E0D5C8] text-[#6B4F3A]/40"}`}>
//                   {done ? <Check size={12} /> : i + 1}
//                 </div>
//                 <span className={`text-sm tracking-widest ${active ? "text-[#1A1410]" : "text-[#6B4F3A]/40"}`}>{s.toUpperCase()}</span>
//                 {i === 0 && <div className="w-12 h-px bg-[#E0D5C8] mx-2" />}
//               </div>
//             );
//           })}
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)}>
//           <div className="grid lg:grid-cols-3 gap-16">
//             {/* Form */}
//             <div className="lg:col-span-2">
//               {step === "shipping" && (
//                 <div>
//                   <h2 className="font-display text-3xl font-light text-[#1A1410] mb-8">Shipping Details</h2>
//                   <div className="grid grid-cols-2 gap-4 mb-4">
//                     <TextField {...register("firstName")} label="First name" error={!!errors.firstName} helperText={errors.firstName?.message} fullWidth />
//                     <TextField {...register("lastName")} label="Last name" error={!!errors.lastName} helperText={errors.lastName?.message} fullWidth />
//                   </div>
//                   <div className="grid grid-cols-2 gap-4 mb-4">
//                     <TextField {...register("email")} label="Email" type="email" error={!!errors.email} helperText={errors.email?.message} fullWidth />
//                     <TextField {...register("phone")} label="Phone" error={!!errors.phone} helperText={errors.phone?.message} fullWidth />
//                   </div>
//                   <TextField {...register("address")} label="Address" error={!!errors.address} helperText={errors.address?.message} fullWidth className="mb-4" />
//                   <div className="grid grid-cols-3 gap-4 mb-8">
//                     <TextField {...register("city")} label="City" error={!!errors.city} helperText={errors.city?.message} fullWidth />
//                     <TextField {...register("zip")} label="ZIP Code" error={!!errors.zip} helperText={errors.zip?.message} fullWidth />
//                     <TextField {...register("country")} label="Country" error={!!errors.country} helperText={errors.country?.message} fullWidth />
//                   </div>
//                   <button
//                     type="button"
//                     onClick={handleNextStep}
//                     className="w-full bg-[#1A1410] text-[#FAF7F2] py-4 text-sm tracking-widest hover:bg-[#C4786A] transition-colors"
//                   >
//                     CONTINUE TO PAYMENT
//                   </button>
//                 </div>
//               )}

//               {step === "payment" && (
//                 <div>
//                   <div className="flex items-center gap-4 mb-8">
//                     <button type="button" onClick={() => setStep("shipping")} className="text-[#6B4F3A]/50 hover:text-[#C4786A] transition-colors">
//                       <ArrowLeft size={16} />
//                     </button>
//                     <h2 className="font-display text-3xl font-light text-[#1A1410]">Payment</h2>
//                   </div>
//                   <div className="border border-[#E0D5C8] p-6 mb-6">
//                     <div className="flex items-center gap-2 mb-6">
//                       <Lock size={14} className="text-[#6B4F3A]/50" />
//                       <span className="text-xs tracking-widest text-[#6B4F3A]/50">YOUR PAYMENT INFO IS ENCRYPTED</span>
//                     </div>
//                     <TextField {...register("cardNumber")} label="Card number" error={!!errors.cardNumber} helperText={errors.cardNumber?.message} fullWidth className="mb-4" placeholder="1234 5678 9012 3456" />
//                     <div className="grid grid-cols-2 gap-4">
//                       <TextField {...register("expiry")} label="Expiry (MM/YY)" error={!!errors.expiry} helperText={errors.expiry?.message} fullWidth placeholder="09/27" />
//                       <TextField {...register("cvv")} label="CVV" error={!!errors.cvv} helperText={errors.cvv?.message} fullWidth placeholder="123" />
//                     </div>
//                   </div>
//                   <button
//                     type="submit"
//                     disabled={placing}
//                     className="w-full flex items-center justify-center gap-3 bg-[#C4786A] text-[#FAF7F2] py-4 text-sm tracking-widest hover:bg-[#6B4F3A] transition-colors disabled:opacity-60"
//                   >
//                     {placing ? "PROCESSING..." : `PLACE ORDER — $${ORDER.total}`}
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Order summary */}
//             <div className="lg:col-span-1">
//               <div className="border border-[#E0D5C8] p-8">
//                 <h3 className="font-display text-xl font-light text-[#1A1410] mb-6">Order Summary</h3>
//                 <div className="flex flex-col gap-5 mb-6">
//                   {ORDER.items.map((item, i) => (
//                     <div key={i} className="flex items-center gap-4">
//                       <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center relative" style={{ backgroundColor: item.bg }}>
//                         <div className="w-5 h-9 bg-white/40 rounded-sm shadow transform -rotate-3" />
//                         <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1A1410] text-[#FAF7F2] text-xs rounded-full flex items-center justify-center">{item.qty}</span>
//                       </div>
//                       <div className="flex-1">
//                         <p className="text-sm text-[#1A1410] font-medium">{item.name}</p>
//                         <p className="text-xs text-[#6B4F3A]/50">{item.size}</p>
//                       </div>
//                       <p className="text-sm text-[#1A1410]">${item.price * item.qty}</p>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="border-t border-[#E0D5C8] pt-5 flex flex-col gap-3">
//                   <div className="flex justify-between text-sm text-[#6B4F3A]">
//                     <span>Subtotal</span><span>${ORDER.subtotal}</span>
//                   </div>
//                   <div className="flex justify-between text-sm text-[#6B4F3A]">
//                     <span>Shipping</span>
//                     <span className="text-[#8A9E8A]">Free</span>
//                   </div>
//                   <div className="flex justify-between border-t border-[#E0D5C8] pt-4 mt-1">
//                     <span className="font-display text-lg text-[#1A1410]">Total</span>
//                     <span className="font-display text-lg text-[#1A1410]">${ORDER.total}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { cartApi, ordersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

const schema = z.object({
  firstName:  z.string().min(1, "Required"),
  lastName:   z.string().min(1, "Required"),
  email:      z.string().email("Invalid email"),
  phone:      z.string().min(8, "Invalid phone"),
  address:    z.string().min(5, "Required"),
  city:       z.string().min(1, "Required"),
  country:    z.string().min(1, "Required"),
  zip:        z.string().min(3, "Required"),
  cardNumber: z.string().min(16, "Invalid card number"),
  expiry:     z.string().min(5, "Invalid expiry"),
  cvv:        z.string().min(3, "Invalid CVV"),
});

type FormData = z.infer<typeof schema>;

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
}

export default function CheckoutPage() {
  const router  = useRouter();
  const { user, loading: authLoading, fetchMe } = useAuthStore();
  const [step,    setStep]    = useState<"shipping" | "payment">("shipping");
  const [placing, setPlacing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login?from=/checkout"); return; }

    cartApi.get()
      .then((res) => setCartItems(res.data?.items ?? []))
      .catch(() => setApiError("Failed to load cart."))
      .finally(() => setCartLoading(false));
  }, [user, authLoading]);

  const handleNextStep = async () => {
    const valid = await trigger([
      "firstName", "lastName", "email", "phone",
      "address", "city", "country", "zip",
    ]);
    if (valid) setStep("payment");
  };

  const onSubmit = async (data: FormData) => {
    setPlacing(true);
    setApiError(null);
    try {
      const shippingAddress = `${data.firstName} ${data.lastName}, ${data.address}, ${data.city} ${data.zip}, ${data.country}`;
      await ordersApi.checkout({
        shippingAddress,
        paymentMethod: "stripe",   // or "cash" — wire a toggle if needed
        currency: "TND",
      });
      router.push("/orders");      // redirect to order history on success
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ?? "Order failed. Please try again."
      );
      setPlacing(false);
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 75 ? 0 : 8;
  const total    = subtotal + shipping;

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 size={32} className="text-[#C4786A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="font-display text-2xl font-light tracking-widest text-[#1A1410]">
            Lumière
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#6B4F3A]/50">
            <Lock size={12} /> Secure checkout
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-12">
          {(["Shipping", "Payment"] as const).map((s, i) => {
            const active = (i === 0 && step === "shipping") || (i === 1 && step === "payment");
            const done   = i === 0 && step === "payment";
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  done   ? "bg-[#8A9E8A] text-white" :
                  active ? "bg-[#1A1410] text-[#FAF7F2]" :
                           "border border-[#E0D5C8] text-[#6B4F3A]/40"
                }`}>
                  {done ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-sm tracking-widest ${active ? "text-[#1A1410]" : "text-[#6B4F3A]/40"}`}>
                  {s.toUpperCase()}
                </span>
                {i === 0 && <div className="w-12 h-px bg-[#E0D5C8] mx-2" />}
              </div>
            );
          })}
        </div>

        {apiError && (
          <div className="mb-6 p-4 border border-[#C4786A] text-[#C4786A] text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Form */}
            <div className="lg:col-span-2">
              {step === "shipping" && (
                <div>
                  <h2 className="font-display text-3xl font-light text-[#1A1410] mb-8">
                    Shipping Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <input {...register("firstName")} placeholder="First name"
                        className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                      {errors.firstName && <p className="text-xs text-[#C4786A] mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <input {...register("lastName")} placeholder="Last name"
                        className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                      {errors.lastName && <p className="text-xs text-[#C4786A] mt-1">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <input {...register("email")} type="email" placeholder="Email"
                        className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                      {errors.email && <p className="text-xs text-[#C4786A] mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <input {...register("phone")} placeholder="Phone"
                        className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                      {errors.phone && <p className="text-xs text-[#C4786A] mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <div className="mb-4">
                    <input {...register("address")} placeholder="Address"
                      className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                    {errors.address && <p className="text-xs text-[#C4786A] mt-1">{errors.address.message}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {(["city", "zip", "country"] as const).map((f) => (
                      <div key={f}>
                        <input {...register(f)} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                          className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                        {errors[f] && <p className="text-xs text-[#C4786A] mt-1">{errors[f]?.message}</p>}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleNextStep}
                    className="w-full bg-[#1A1410] text-[#FAF7F2] py-4 text-sm tracking-widest hover:bg-[#C4786A] transition-colors">
                    CONTINUE TO PAYMENT
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <button type="button" onClick={() => setStep("shipping")}
                      className="text-[#6B4F3A]/50 hover:text-[#C4786A] transition-colors">
                      <ArrowLeft size={16} />
                    </button>
                    <h2 className="font-display text-3xl font-light text-[#1A1410]">Payment</h2>
                  </div>
                  <div className="border border-[#E0D5C8] p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Lock size={14} className="text-[#6B4F3A]/50" />
                      <span className="text-xs tracking-widest text-[#6B4F3A]/50">
                        YOUR PAYMENT INFO IS ENCRYPTED
                      </span>
                    </div>
                    <div className="mb-4">
                      <input {...register("cardNumber")} placeholder="Card number (1234 5678 9012 3456)"
                        className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                      {errors.cardNumber && <p className="text-xs text-[#C4786A] mt-1">{errors.cardNumber.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input {...register("expiry")} placeholder="MM/YY"
                          className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                        {errors.expiry && <p className="text-xs text-[#C4786A] mt-1">{errors.expiry.message}</p>}
                      </div>
                      <div>
                        <input {...register("cvv")} placeholder="CVV"
                          className="w-full border border-[#E0D5C8] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#C4786A]" />
                        {errors.cvv && <p className="text-xs text-[#C4786A] mt-1">{errors.cvv.message}</p>}
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={placing}
                    className="w-full flex items-center justify-center gap-3 bg-[#C4786A] text-[#FAF7F2] py-4 text-sm tracking-widest hover:bg-[#6B4F3A] transition-colors disabled:opacity-60">
                    {placing
                      ? <><Loader2 size={14} className="animate-spin" /> PROCESSING...</>
                      : `PLACE ORDER — $${total.toFixed(2)}`}
                  </button>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="border border-[#E0D5C8] p-8">
                <h3 className="font-display text-xl font-light text-[#1A1410] mb-6">Order Summary</h3>
                <div className="flex flex-col gap-5 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4">
                      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-[#E8C4B8] relative">
                        <div className="w-5 h-9 bg-white/40 rounded-sm shadow transform -rotate-3" />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1A1410] text-[#FAF7F2] text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#1A1410] font-medium">
                          {item.productName ?? item.productId}
                        </p>
                      </div>
                      <p className="text-sm text-[#1A1410]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E0D5C8] pt-5 flex flex-col gap-3">
                  <div className="flex justify-between text-sm text-[#6B4F3A]">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6B4F3A]">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-[#8A9E8A]" : ""}>
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#E0D5C8] pt-4 mt-1">
                    <span className="font-display text-lg text-[#1A1410]">Total</span>
                    <span className="font-display text-lg text-[#1A1410]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
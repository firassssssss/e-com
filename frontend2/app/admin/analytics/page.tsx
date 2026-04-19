// "use client";

// import { useEffect, useState } from "react";
// import api from "@/lib/api";
// import {
//   AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
// } from "recharts";
// import {
//   Users, ShoppingBag, DollarSign, UserCheck,
//   ChevronRight, ChevronUp, ChevronDown,
//   X, Eye, Search, Heart,
// } from "lucide-react";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface ActivityPoint {
//   date: string;
//   views: number;
//   searches: number;
//   carts: number;
//   wishlists: number;
// }

// interface KPI {
//   totalUsers: number;
//   totalOrders: number;
//   totalRevenue: number;
//   activeUsers7d: number;
// }

// interface UserSummary {
//   id: string;
//   name: string | null;
//   email: string | null;
//   views: number;
//   searches: number;
//   carts: number;
//   wishlists: number;
//   total: number;
//   last_active: string | null;
// }

// interface UserDetail {
//   views: number;
//   searches: number;
//   carts: number;
//   wishlists: number;
//   recentSignals: {
//     id: string;
//     type: string;
//     productId?: string;
//     searchQuery?: string;
//     weight: number;
//     createdAt: string;
//   }[];
// }

// type SortKey = "total" | "views" | "searches" | "carts" | "wishlists";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const PALETTE: Record<string, string> = {
//   views:     "#C4786A",
//   searches:  "#8A9E8A",
//   carts:     "#6B4F3A",
//   wishlists: "#9B8EA0",
// };
// const PIE_COLORS = ["#C4786A", "#8A9E8A", "#6B4F3A", "#9B8EA0"];

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// function fmt(n: number) {
//   return n >= 1_000_000
//     ? `${(n / 1_000_000).toFixed(1)}M`
//     : n >= 1_000
//     ? `${(n / 1_000).toFixed(1)}k`
//     : String(n);
// }

// function fmtCurrency(n: number) {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     maximumFractionDigits: 0,
//   }).format(n);
// }

// function fmtDate(s: string | null) {
//   if (!s) return "—";
//   return new Date(s).toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//   });
// }

// function fmtDateTime(s: string) {
//   return new Date(s).toLocaleString("en-US", {
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function KPICard({
//   label,
//   value,
//   icon: Icon,
//   sub,
//   accent = false,
//   loading = false,
// }: {
//   label: string;
//   value: string;
//   icon: React.ComponentType<{ size?: number; className?: string }>;
//   sub: string;
//   accent?: boolean;
//   loading?: boolean;
// }) {
//   return (
//     <div className={`bg-white border rounded-sm p-5 flex flex-col gap-3 ${accent ? "border-[#C4786A]" : "border-[#E0D5C8]"}`}>
//       <div className="flex items-center justify-between">
//         <span className="text-xs uppercase tracking-widest text-[#6B4F3A]/50 font-medium">{label}</span>
//         <span className={`p-2 rounded-sm ${accent ? "bg-[#C4786A]/10" : "bg-[#FAF7F2]"}`}>
//           <Icon size={16} className={accent ? "text-[#C4786A]" : "text-[#6B4F3A]"} />
//         </span>
//       </div>
//       {loading ? (
//         <div className="h-9 w-24 bg-[#E0D5C8]/40 rounded animate-pulse" />
//       ) : (
//         <p className="text-3xl font-light text-[#1A1410] tracking-tight">{value}</p>
//       )}
//       <p className="text-xs text-[#6B4F3A]/40">{sub}</p>
//     </div>
//   );
// }

// function SortBtn({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
//   if (!active) return null;
//   return dir === "asc"
//     ? <ChevronUp size={11} className="inline ml-0.5 -mt-0.5" />
//     : <ChevronDown size={11} className="inline ml-0.5 -mt-0.5" />;
// }

// function SignalIcon({ type }: { type: string }) {
//   const map: Record<string, JSX.Element> = {
//     view:     <Eye size={12} className="text-[#C4786A]" />,
//     search:   <Search size={12} className="text-[#8A9E8A]" />,
//     cart:     <ShoppingBag size={12} className="text-[#6B4F3A]" />,
//     wishlist: <Heart size={12} className="text-[#9B8EA0]" />,
//   };
//   return map[type] ?? null;
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────

// export default function AdminAnalyticsPage() {
//   const [period, setPeriod] = useState<"day" | "week" | "month">("week");
//   const [tab, setTab] = useState<"overview" | "users">("overview");

//   const [activity, setActivity] = useState<ActivityPoint[]>([]);
//   const [kpi, setKpi] = useState<KPI | null>(null);
//   const [users, setUsers] = useState<UserSummary[]>([]);

//   const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
//   const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

//   const [search, setSearch] = useState("");
//   const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "total", dir: "desc" });

//   const [loadingKpi, setLoadingKpi] = useState(true);
//   const [loadingActivity, setLoadingActivity] = useState(true);
//   const [loadingUsers, setLoadingUsers] = useState(true);
//   const [loadingDetail, setLoadingDetail] = useState(false);

//   // fetch activity
//   useEffect(() => {
//     setLoadingActivity(true);
//     const doFetch = () =>
//       api.get(`/api/admin/analytics/activity?period=${period}`)
//         .then((r) => setActivity(r.data.data ?? []))
//         .finally(() => setLoadingActivity(false));
//     doFetch();
//     const iv = setInterval(doFetch, 15_000);
//     return () => clearInterval(iv);
//   }, [period]);

//   // fetch KPIs
//   useEffect(() => {
//     const doFetch = () =>
//       api.get("/api/admin/analytics/overview")
//         .then((r) => setKpi(r.data.data))
//         .finally(() => setLoadingKpi(false));
//     doFetch();
//     const iv = setInterval(doFetch, 30_000);
//     return () => clearInterval(iv);
//   }, []);

//   // fetch users summary
//   useEffect(() => {
//     const doFetch = () =>
//       api.get("/api/admin/analytics/users/summary")
//         .then((r) => setUsers(r.data.data ?? []))
//         .finally(() => setLoadingUsers(false));
//     doFetch();
//     const iv = setInterval(doFetch, 30_000);
//     return () => clearInterval(iv);
//   }, []);

//   // user detail panel
//   useEffect(() => {
//     if (!selectedUser) { setUserDetail(null); return; }
//     setLoadingDetail(true);
//     api.get(`/api/admin/users/${selectedUser.id}/activity`)
//       .then((r) => setUserDetail(r.data.data))
//       .finally(() => setLoadingDetail(false));
//   }, [selectedUser]);

//   // derived
//   const pieData = activity.length
//     ? (["views", "searches", "carts", "wishlists"] as const).map((k) => ({
//         name: k.charAt(0).toUpperCase() + k.slice(1),
//         value: activity.reduce((s, d) => s + (d[k] ?? 0), 0),
//       }))
//     : [];

//   const filteredUsers = users
//     .filter((u) =>
//       !search ||
//       u.name?.toLowerCase().includes(search.toLowerCase()) ||
//       u.email?.toLowerCase().includes(search.toLowerCase())
//     )
//     .sort((a, b) => {
//       const diff = a[sort.key] - b[sort.key];
//       return sort.dir === "asc" ? diff : -diff;
//     });

//   const maxByKey = (key: SortKey) => Math.max(...users.map((u) => u[key])) || 1;
//   const toggleSort = (key: SortKey) =>
//     setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

//   return (
//     <div className="min-h-screen bg-[#FAF7F2]">
//       {/* Top bar */}
//       <div className="sticky top-0 z-20 bg-white border-b border-[#E0D5C8] px-8 py-4 flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-light text-[#1A1410] tracking-wide">Analytics</h1>
//           <p className="text-xs text-[#6B4F3A]/40 mt-0.5 tracking-wide">Real-time ecommerce intelligence</p>
//         </div>
//         <div className="flex gap-1.5">
//           {(["day", "week", "month"] as const).map((p) => (
//             <button
//               key={p}
//               onClick={() => setPeriod(p)}
//               className={`px-4 py-1.5 text-xs tracking-widest uppercase rounded-sm transition-colors ${
//                 period === p
//                   ? "bg-[#1A1410] text-white"
//                   : "border border-[#E0D5C8] text-[#6B4F3A] hover:bg-[#F0EAE2]"
//               }`}
//             >
//               {p}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
//         {/* KPI cards */}
//         <div className="grid grid-cols-4 gap-4">
//           <KPICard label="Total Users"    value={kpi ? fmt(kpi.totalUsers)         : "—"} icon={Users}      sub="Registered accounts"           loading={loadingKpi} />
//           <KPICard label="Active (7 days)" value={kpi ? fmt(kpi.activeUsers7d)     : "—"} icon={UserCheck}  sub="Users with recorded signals" accent loading={loadingKpi} />
//           <KPICard label="Total Orders"   value={kpi ? fmt(kpi.totalOrders)        : "—"} icon={ShoppingBag} sub="All-time orders placed"        loading={loadingKpi} />
//           <KPICard label="Gross Revenue"  value={kpi ? fmtCurrency(kpi.totalRevenue) : "—"} icon={DollarSign} sub="Sum of all orders"           loading={loadingKpi} />
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-0 border-b border-[#E0D5C8]">
//           {[
//             { key: "overview", label: "Activity Overview" },
//             { key: "users",    label: `User Breakdown${users.length ? ` (${users.length})` : ""}` },
//           ].map(({ key, label }) => (
//             <button
//               key={key}
//               onClick={() => setTab(key as "overview" | "users")}
//               className={`px-6 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
//                 tab === key
//                   ? "border-[#C4786A] text-[#1A1410] font-medium"
//                   : "border-transparent text-[#6B4F3A]/50 hover:text-[#6B4F3A]"
//               }`}
//             >
//               {label}
//             </button>
//           ))}
//         </div>

//         {/* ── OVERVIEW TAB ── */}
//         {tab === "overview" && (
//           <div className="space-y-6">
//             <div className="grid grid-cols-3 gap-6">
//               {/* Area chart */}
//               <div className="col-span-2 bg-white border border-[#E0D5C8] rounded-sm p-6">
//                 <p className="text-sm font-medium text-[#1A1410]">Activity Trend</p>
//                 <p className="text-xs text-[#6B4F3A]/40 mb-5">Engagement signals aggregated by date</p>
//                 {loadingActivity ? (
//                   <div className="h-64 flex items-center justify-center text-sm text-[#6B4F3A]/30">Loading…</div>
//                 ) : activity.length === 0 ? (
//                   <div className="h-64 flex items-center justify-center text-sm text-[#6B4F3A]/30">No data for this period</div>
//                 ) : (
//                   <ResponsiveContainer width="100%" height={260}>
//                     <AreaChart data={activity}>
//                       <defs>
//                         {Object.entries(PALETTE).map(([k, c]) => (
//                           <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%"  stopColor={c} stopOpacity={0.18} />
//                             <stop offset="95%" stopColor={c} stopOpacity={0} />
//                           </linearGradient>
//                         ))}
//                       </defs>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#E0D5C8" />
//                       <XAxis dataKey="date" stroke="#A89080" tick={{ fontSize: 11 }} />
//                       <YAxis stroke="#A89080" tick={{ fontSize: 11 }} />
//                       <Tooltip contentStyle={{ border: "1px solid #E0D5C8", borderRadius: 2, fontSize: 12 }} labelStyle={{ color: "#1A1410", fontWeight: 500 }} />
//                       <Legend wrapperStyle={{ fontSize: 12 }} />
//                       {Object.entries(PALETTE).map(([k, c]) => (
//                         <Area key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} fill={`url(#g-${k})`} />
//                       ))}
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 )}
//               </div>

//               {/* Pie */}
//               <div className="bg-white border border-[#E0D5C8] rounded-sm p-6">
//                 <p className="text-sm font-medium text-[#1A1410]">Signal Mix</p>
//                 <p className="text-xs text-[#6B4F3A]/40 mb-4">Total by type for period</p>
//                 {pieData.length === 0 ? (
//                   <div className="h-48 flex items-center justify-center text-sm text-[#6B4F3A]/30">No data</div>
//                 ) : (
//                   <>
//                     <ResponsiveContainer width="100%" height={180}>
//                       <PieChart>
//                         <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
//                           {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
//                         </Pie>
//                         <Tooltip contentStyle={{ border: "1px solid #E0D5C8", borderRadius: 2, fontSize: 12 }} />
//                       </PieChart>
//                     </ResponsiveContainer>
//                     <div className="space-y-2.5 mt-1">
//                       {pieData.map((d, i) => {
//                         const total = pieData.reduce((s, x) => s + x.value, 0) || 1;
//                         return (
//                           <div key={d.name} className="flex items-center justify-between text-xs">
//                             <span className="flex items-center gap-2">
//                               <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
//                               <span className="text-[#6B4F3A]">{d.name}</span>
//                             </span>
//                             <span className="font-medium text-[#1A1410] tabular-nums">
//                               {fmt(d.value)}{" "}
//                               <span className="text-[#6B4F3A]/40">{Math.round((d.value / total) * 100)}%</span>
//                             </span>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Stacked bar */}
//             {activity.length > 0 && (
//               <div className="bg-white border border-[#E0D5C8] rounded-sm p-6">
//                 <p className="text-sm font-medium text-[#1A1410]">Daily Volume — Stacked</p>
//                 <p className="text-xs text-[#6B4F3A]/40 mb-5">All signal types stacked per day</p>
//                 <ResponsiveContainer width="100%" height={200}>
//                   <BarChart data={activity} barSize={activity.length > 14 ? 12 : 20}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#E0D5C8" vertical={false} />
//                     <XAxis dataKey="date" stroke="#A89080" tick={{ fontSize: 11 }} />
//                     <YAxis stroke="#A89080" tick={{ fontSize: 11 }} />
//                     <Tooltip contentStyle={{ border: "1px solid #E0D5C8", borderRadius: 2, fontSize: 12 }} />
//                     <Legend wrapperStyle={{ fontSize: 12 }} />
//                     {Object.entries(PALETTE).map(([k, c]) => (
//                       <Bar key={k} dataKey={k} stackId="a" fill={c} radius={k === "wishlists" ? [3, 3, 0, 0] : undefined} />
//                     ))}
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── USERS TAB ── */}
//         {tab === "users" && (
//           <div className="space-y-4">
//             <div className="flex items-center gap-4">
//               <input
//                 type="text"
//                 placeholder="Search name or email…"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="border border-[#E0D5C8] rounded-sm px-4 py-2 text-sm text-[#1A1410] bg-white placeholder:text-[#6B4F3A]/30 focus:outline-none focus:border-[#C4786A] w-72 transition-colors"
//               />
//               <span className="text-xs text-[#6B4F3A]/40">{filteredUsers.length} users</span>
//             </div>

//             <div className="bg-white border border-[#E0D5C8] rounded-sm overflow-x-auto">
//               <table className="w-full text-sm min-w-[760px]">
//                 <thead>
//                   <tr className="bg-[#FAF7F2] border-b border-[#E0D5C8]">
//                     <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">User</th>
//                     {(["views","searches","carts","wishlists","total"] as SortKey[]).map((k) => (
//                       <th key={k} onClick={() => toggleSort(k)}
//                         className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium cursor-pointer hover:text-[#6B4F3A] select-none whitespace-nowrap">
//                         {k} <SortBtn active={sort.key === k} dir={sort.dir} />
//                       </th>
//                     ))}
//                     <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-[#6B4F3A]/50 font-medium">Last Active</th>
//                     <th className="w-8" />
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-[#E0D5C8]">
//                   {loadingUsers ? (
//                     Array.from({ length: 6 }).map((_, i) => (
//                       <tr key={i}>
//                         <td className="px-5 py-4">
//                           <div className="h-3 w-32 bg-[#E0D5C8]/60 rounded animate-pulse mb-1.5" />
//                           <div className="h-2.5 w-48 bg-[#E0D5C8]/40 rounded animate-pulse" />
//                         </td>
//                         {Array.from({ length: 6 }).map((_, j) => (
//                           <td key={j} className="px-4 py-4 text-right">
//                             <div className="h-3 w-8 bg-[#E0D5C8]/40 rounded animate-pulse ml-auto" />
//                           </td>
//                         ))}
//                         <td /><td />
//                       </tr>
//                     ))
//                   ) : filteredUsers.length === 0 ? (
//                     <tr>
//                       <td colSpan={8} className="text-center py-16 text-sm text-[#6B4F3A]/30">No users found</td>
//                     </tr>
//                   ) : (
//                     filteredUsers.map((u) => (
//                       <tr key={u.id} onClick={() => setSelectedUser(u)}
//                         className="hover:bg-[#FAF7F2] cursor-pointer transition-colors group">
//                         <td className="px-5 py-3.5">
//                           <p className="font-medium text-[#1A1410]">
//                             {u.name || <span className="text-[#6B4F3A]/30 italic">No name</span>}
//                           </p>
//                           <p className="text-xs text-[#6B4F3A]/40 mt-0.5">{u.email}</p>
//                         </td>
//                         {(["views","searches","carts","wishlists"] as const).map((k) => {
//                           const pct = Math.round((u[k] / maxByKey(k)) * 100);
//                           return (
//                             <td key={k} className="px-4 py-3.5 text-right">
//                               <div className="flex items-center justify-end gap-2">
//                                 <div className="w-14 h-1.5 bg-[#E0D5C8] rounded-full overflow-hidden">
//                                   <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PALETTE[k] }} />
//                                 </div>
//                                 <span className="tabular-nums text-[#1A1410] w-5 text-right">{u[k]}</span>
//                               </div>
//                             </td>
//                           );
//                         })}
//                         <td className="px-4 py-3.5 text-right font-semibold text-[#1A1410] tabular-nums">{u.total}</td>
//                         <td className="px-5 py-3.5 text-right text-xs text-[#6B4F3A]/40">{fmtDate(u.last_active)}</td>
//                         <td className="pr-3 text-[#6B4F3A]/20 group-hover:text-[#6B4F3A]/60 transition-colors">
//                           <ChevronRight size={16} />
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ── USER DETAIL SLIDE-OVER ── */}
//       {selectedUser && (
//         <div className="fixed inset-0 z-50 flex">
//           <div className="flex-1 bg-black/20 backdrop-blur-[1px]" onClick={() => setSelectedUser(null)} />
//           <div className="w-[500px] bg-white shadow-2xl flex flex-col h-full border-l border-[#E0D5C8] overflow-hidden">
//             <div className="px-6 py-5 border-b border-[#E0D5C8] flex items-start justify-between bg-[#FAF7F2]">
//               <div>
//                 <p className="text-xs uppercase tracking-widest text-[#6B4F3A]/40 mb-1">User Activity</p>
//                 <h3 className="text-lg font-light text-[#1A1410]">{selectedUser.name || "Unnamed User"}</h3>
//                 <p className="text-sm text-[#6B4F3A]/50 mt-0.5">{selectedUser.email}</p>
//               </div>
//               <button onClick={() => setSelectedUser(null)} className="text-[#6B4F3A]/30 hover:text-[#1A1410] transition-colors mt-1">
//                 <X size={20} />
//               </button>
//             </div>

//             {loadingDetail ? (
//               <div className="flex-1 flex items-center justify-center">
//                 <div className="text-sm text-[#6B4F3A]/30">Loading…</div>
//               </div>
//             ) : userDetail ? (
//               <div className="flex-1 overflow-y-auto p-6 space-y-7">
//                 <div className="grid grid-cols-2 gap-3">
//                   {([
//                     { k: "views",     label: "Product Views" },
//                     { k: "searches",  label: "Searches" },
//                     { k: "carts",     label: "Cart Adds" },
//                     { k: "wishlists", label: "Wishlisted" },
//                   ] as const).map(({ k, label }) => (
//                     <div key={k} className="border border-[#E0D5C8] rounded-sm p-4">
//                       <p className="text-xs text-[#6B4F3A]/40 uppercase tracking-wider mb-1.5">{label}</p>
//                       <p className="text-2xl font-light tabular-nums" style={{ color: PALETTE[k] }}>{userDetail[k]}</p>
//                     </div>
//                   ))}
//                 </div>

//                 <div>
//                   <p className="text-xs uppercase tracking-widest text-[#6B4F3A]/40 mb-3">Engagement Breakdown</p>
//                   <div className="space-y-3">
//                     {(["views","searches","carts","wishlists"] as const).map((k) => {
//                       const total = (userDetail.views + userDetail.searches + userDetail.carts + userDetail.wishlists) || 1;
//                       const pct = Math.round((userDetail[k] / total) * 100);
//                       return (
//                         <div key={k} className="flex items-center gap-3 text-xs">
//                           <span className="w-16 capitalize text-[#6B4F3A]/50">{k}</span>
//                           <div className="flex-1 h-2 bg-[#E0D5C8] rounded-full overflow-hidden">
//                             <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PALETTE[k] }} />
//                           </div>
//                           <span className="w-9 text-right font-medium text-[#1A1410] tabular-nums">{pct}%</span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 <div>
//                   <p className="text-xs uppercase tracking-widest text-[#6B4F3A]/40 mb-3">Recent Signals</p>
//                   {userDetail.recentSignals.length === 0 ? (
//                     <p className="text-center py-8 text-sm text-[#6B4F3A]/30">No recorded signals</p>
//                   ) : (
//                     <div className="space-y-1.5">
//                       {userDetail.recentSignals.slice(0, 40).map((s) => (
//                         <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 bg-[#FAF7F2] rounded-sm text-xs border border-[#E0D5C8]/60">
//                           <span className="flex-shrink-0"><SignalIcon type={s.type} /></span>
//                           <span className="capitalize font-medium w-14 flex-shrink-0" style={{ color: PALETTE[s.type] ?? "#1A1410" }}>{s.type}</span>
//                           <span className="flex-1 text-[#6B4F3A]/50 truncate">
//                             {s.searchQuery || s.productId || <span className="italic text-[#6B4F3A]/30">—</span>}
//                           </span>
//                           <span className="text-[#6B4F3A]/30 whitespace-nowrap flex-shrink-0">{fmtDateTime(s.createdAt)}</span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : null}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Users, ShoppingBag, DollarSign, UserCheck,
  ChevronRight, ChevronUp, ChevronDown,
  X, Eye, Search, Heart,
} from "lucide-react";

// --- Types --------------------------------------------------------------------

interface ActivityPoint {
  date: string;
  views: number;
  searches: number;
  carts: number;
  wishlists: number;
}
interface KPI {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers7d: number;
}
interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  views: number;
  searches: number;
  carts: number;
  wishlists: number;
  total: number;
  last_active: string | null;
}
interface UserDetail {
  views: number;
  searches: number;
  carts: number;
  wishlists: number;
  recentSignals: {
    id: string;
    type: string;
    productId?: string;
    searchQuery?: string;
    weight: number;
    createdAt: string;
  }[];
}
type SortKey = "total" | "views" | "searches" | "carts" | "wishlists";

// --- Constants ----------------------------------------------------------------

const D = {
  bg:     "#0A0A0F",
  panel:  "#111118",
  panelB: "#16161f",
  border: "rgba(255,255,255,0.07)",
  text:   "#fff",
  muted:  "rgba(255,255,255,0.5)",
  dim:    "rgba(255,255,255,0.22)",
  orange: "#FF5F1F",
  cyan:   "#00FFFF",
  purple: "#9B59FF",
  green:  "#00FFAA",
  font:   "'Syncopate', sans-serif",
  mono:   "monospace",
};

// Dark-themed palette for charts
const PALETTE: Record<string, string> = {
  views:     "#FF5F1F",
  searches:  "#00FFFF",
  carts:     "#9B59FF",
  wishlists: "#00FFAA",
};
const PIE_COLORS = ["#FF5F1F", "#00FFFF", "#9B59FF", "#00FFAA"];

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#16161f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    fontSize: 11,
    color: "#fff",
  },
  labelStyle: { color: "rgba(255,255,255,0.6)", fontWeight: 500 },
};

// --- Helpers ------------------------------------------------------------------

function fmt(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
    : String(n);
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// --- Sub-components -----------------------------------------------------------

function KPICard({ label, value, icon: Icon, sub, accent = false, loading = false }: {
  label: string; value: string; icon: React.ComponentType<any>; sub: string; accent?: boolean; loading?: boolean;
}) {
  return (
    <div style={{
      background: D.panel,
      border: `1px solid ${accent ? "rgba(255,95,31,0.3)" : D.border}`,
      borderRadius: 4,
      padding: "1.25rem",
      display: "flex", flexDirection: "column", gap: "0.75rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim }}>
          {label}
        </span>
        <span style={{
          padding: "0.35rem",
          borderRadius: 3,
          background: accent ? "rgba(255,95,31,0.1)" : "rgba(255,255,255,0.04)",
        }}>
          <Icon size={14} color={accent ? D.orange : D.dim} />
        </span>
      </div>
      {loading ? (
        <div style={{ height: 36, width: 90, background: D.border, borderRadius: 3 }} />
      ) : (
        <p style={{ fontFamily: D.mono, fontSize: "1.85rem", fontWeight: 700, color: accent ? D.orange : D.text, lineHeight: 1 }}>
          {value}
        </p>
      )}
      <p style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>{sub}</p>
    </div>
  );
}

function SortBtn({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return null;
  return dir === "asc"
    ? <ChevronUp size={10} style={{ display: "inline", marginLeft: 3 }} />
    : <ChevronDown size={10} style={{ display: "inline", marginLeft: 3 }} />;
}

function SignalIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    view: D.orange, search: D.cyan, cart: D.purple, wishlist: D.green,
  };
  const icons: Record<string, JSX.Element> = {
    view:     <Eye size={11} color={colors.view} />,
    search:   <Search size={11} color={colors.search} />,
    cart:     <ShoppingBag size={11} color={colors.cart} />,
    wishlist: <Heart size={11} color={colors.wishlist} />,
  };
  return icons[type] ?? null;
}

// --- Main Page ----------------------------------------------------------------

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [tab, setTab] = useState<"overview" | "users">("overview");

  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "total", dir: "desc" });

  const [loadingKpi, setLoadingKpi]         = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingUsers, setLoadingUsers]       = useState(true);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);

  useEffect(() => {
    setLoadingActivity(true);
    const doFetch = () =>
      api.get(`/api/admin/analytics/activity?period=${period}`)
        .then((r) => setActivity(r.data.data ?? []))
        .finally(() => setLoadingActivity(false));
    doFetch();
    const iv = setInterval(doFetch, 15_000);
    return () => clearInterval(iv);
  }, [period]);

  useEffect(() => {
    const doFetch = () =>
      api.get("/api/admin/analytics/overview")
        .then((r) => setKpi(r.data.data))
        .finally(() => setLoadingKpi(false));
    doFetch();
    const iv = setInterval(doFetch, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const doFetch = () =>
      api.get("/api/admin/analytics/users/summary")
        .then((r) => setUsers(r.data.data ?? []))
        .finally(() => setLoadingUsers(false));
    doFetch();
    const iv = setInterval(doFetch, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!selectedUser) { setUserDetail(null); return; }
    setLoadingDetail(true);
    api.get(`/api/admin/users/${selectedUser.id}/activity`)
      .then((r) => setUserDetail(r.data.data))
      .finally(() => setLoadingDetail(false));
  }, [selectedUser]);

  const pieData = activity.length
    ? (["views", "searches", "carts", "wishlists"] as const).map((k) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        value: activity.reduce((s, d) => s + (d[k] ?? 0), 0),
      }))
    : [];

  const filteredUsers = users
    .filter((u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const diff = a[sort.key] - b[sort.key];
      return sort.dir === "asc" ? diff : -diff;
    });

  const maxByKey = (key: SortKey) => Math.max(...users.map((u) => u[key])) || 1;
  const toggleSort = (key: SortKey) =>
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const th: React.CSSProperties = {
    fontFamily: D.font,
    fontSize: "0.42rem",
    letterSpacing: "0.15em",
    color: D.dim,
    padding: "0.85rem 1rem",
    fontWeight: 400,
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "0.85rem 1rem",
    borderBottom: `1px solid ${D.border}`,
    color: D.muted,
    fontSize: "0.8rem",
    verticalAlign: "middle",
  };

  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "#0d0d14",
        borderBottom: `1px solid ${D.border}`,
        padding: "1rem 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.5rem",
      }}>
        <div>
          <p style={{ fontFamily: D.font, fontSize: "0.85rem", letterSpacing: "0.22em", fontWeight: 700, color: D.text }}>
            Analytics
          </p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, marginTop: 4 }}>
            Real-time ecommerce intelligence
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                background: period === p ? D.orange : "transparent",
                border: `1px solid ${period === p ? D.orange : D.border}`,
                borderRadius: 3, padding: "0.45rem 0.9rem",
                fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: period === p ? "#fff" : D.dim,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >{p}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400 }}>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <KPICard label="Total Users"    value={kpi ? fmt(kpi.totalUsers) : "—"}               icon={Users}      sub="Registered accounts"         loading={loadingKpi} />
          <KPICard label="Active (7 days)" value={kpi ? fmt(kpi.activeUsers7d) : "—"}           icon={UserCheck}  sub="Users with recorded signals"  loading={loadingKpi} accent />
          <KPICard label="Total Orders"   value={kpi ? fmt(kpi.totalOrders) : "—"}              icon={ShoppingBag} sub="All-time orders placed"       loading={loadingKpi} />
          <KPICard label="Gross Revenue"  value={kpi ? fmtCurrency(kpi.totalRevenue) : "—"}     icon={DollarSign} sub="Sum of all orders"            loading={loadingKpi} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, marginBottom: "1.5rem" }}>
          {[
            { key: "overview", label: "Activity Overview" },
            { key: "users",    label: `User Breakdown${users.length ? ` (${users.length})` : ""}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as "overview" | "users")}
              style={{
                padding: "0.75rem 1.5rem",
                fontFamily: D.font, fontSize: "0.48rem", letterSpacing: "0.15em",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${tab === key ? D.orange : "transparent"}`,
                marginBottom: -1,
                color: tab === key ? D.text : D.dim,
                transition: "all 0.15s",
              }}
            >{label}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>

              {/* Area chart */}
              <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>
                  Activity Trend
                </p>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1.25rem" }}>
                  Engagement signals aggregated by date
                </p>
                {loadingActivity ? (
                  <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim }}>Loading…</span>
                  </div>
                ) : activity.length === 0 ? (
                  <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim }}>No data for this period</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={activity}>
                      <defs>
                        {Object.entries(PALETTE).map(([k, c]) => (
                          <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={c} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                      <Tooltip {...CHART_TOOLTIP} />
                      <Legend wrapperStyle={{ fontSize: 11, color: D.dim }} />
                      {Object.entries(PALETTE).map(([k, c]) => (
                        <Area key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={1.5} fill={`url(#g-${k})`} dot={false} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie */}
              <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>
                  Signal Mix
                </p>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1rem" }}>
                  Total by type for period
                </p>
                {pieData.length === 0 ? (
                  <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>No data</span>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip {...CHART_TOOLTIP} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.75rem" }}>
                      {pieData.map((d, i) => {
                        const total = pieData.reduce((s, x) => s + x.value, 0) || 1;
                        return (
                          <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{
                                width: 7, height: 7, borderRadius: "50%",
                                background: PIE_COLORS[i],
                                boxShadow: `0 0 5px ${PIE_COLORS[i]}`,
                                flexShrink: 0,
                              }} />
                              <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.muted }}>{d.name}</span>
                            </span>
                            <span style={{ fontFamily: D.mono, fontSize: "0.78rem", color: D.text }}>
                              {fmt(d.value)}{" "}
                              <span style={{ color: D.dim }}>{Math.round((d.value / total) * 100)}%</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stacked bar */}
            {activity.length > 0 && (
              <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>
                  Daily Volume — Stacked
                </p>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1.25rem" }}>
                  All signal types stacked per day
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activity} barSize={activity.length > 14 ? 12 : 20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Legend wrapperStyle={{ fontSize: 11, color: D.dim }} />
                    {Object.entries(PALETTE).map(([k, c]) => (
                      <Bar key={k} dataKey={k} stackId="a" fill={c} radius={k === "wishlists" ? [3, 3, 0, 0] : undefined} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                background: D.panel,
                border: `1px solid ${searchFocused ? "rgba(255,95,31,0.4)" : D.border}`,
                borderRadius: 4, padding: "0.6rem 0.9rem",
                width: 280,
              }}>
                <Search size={12} color={D.dim} />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    background: "none", border: "none", outline: "none",
                    fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.1em",
                    color: D.text, width: "100%",
                  }}
                />
              </div>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim }}>
                {filteredUsers.length} users
              </span>
            </div>

            <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                    <th style={{ ...th, textAlign: "left" }}>User</th>
                    {(["views", "searches", "carts", "wishlists", "total"] as SortKey[]).map((k) => (
                      <th
                        key={k}
                        onClick={() => toggleSort(k)}
                        style={{ ...th, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                      >
                        {k} <SortBtn active={sort.key === k} dir={sort.dir} />
                      </th>
                    ))}
                    <th style={{ ...th, textAlign: "right" }}>Last Active</th>
                    <th style={{ width: 28 }} />
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ height: 10, width: 120, background: D.border, borderRadius: 2, marginBottom: 6 }} />
                          <div style={{ height: 8, width: 180, background: D.border, borderRadius: 2 }} />
                        </td>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={{ padding: "1rem", textAlign: "right" }}>
                            <div style={{ height: 10, width: 32, background: D.border, borderRadius: 2, marginLeft: "auto" }} />
                          </td>
                        ))}
                        <td /><td />
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: D.dim }}>
                        <span style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.18em" }}>No users found</span>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <AnalyticsUserRow
                        key={u.id}
                        u={u}
                        maxByKey={maxByKey}
                        onSelect={() => setSelectedUser(u)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User detail slide-over */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setSelectedUser(null)}
          />
          <div style={{
            width: 480,
            background: D.panelB,
            borderLeft: `1px solid ${D.border}`,
            display: "flex", flexDirection: "column", height: "100%",
            overflow: "hidden",
          }}>
            {/* Slide-over header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: `1px solid ${D.border}`,
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              background: D.panel,
            }}>
              <div>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim, marginBottom: 6 }}>
                  User Activity
                </p>
                <p style={{ fontFamily: D.font, fontSize: "0.7rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>
                  {selectedUser.name ?? "Unnamed User"}
                </p>
                <p style={{ fontFamily: D.mono, fontSize: "0.75rem", color: D.muted }}>{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: D.dim, transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = D.text)}
                onMouseLeave={e => (e.currentTarget.style.color = D.dim)}
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim }}>Loading…</span>
              </div>
            ) : userDetail ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                  {([
                    { k: "views",     label: "Product Views" },
                    { k: "searches",  label: "Searches" },
                    { k: "carts",     label: "Cart Adds" },
                    { k: "wishlists", label: "Wishlisted" },
                  ] as const).map(({ k, label }) => (
                    <div key={k} style={{
                      background: D.panel,
                      border: `1px solid ${D.border}`,
                      borderRadius: 4, padding: "1rem",
                    }}>
                      <p style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.15em", color: D.dim, marginBottom: "0.6rem" }}>{label}</p>
                      <p style={{ fontFamily: D.mono, fontSize: "1.6rem", fontWeight: 700, color: PALETTE[k], lineHeight: 1 }}>
                        {userDetail[k]}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Engagement breakdown */}
                <div>
                  <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim, marginBottom: "0.85rem" }}>
                    Engagement Breakdown
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {(["views", "searches", "carts", "wishlists"] as const).map((k) => {
                      const total = (userDetail.views + userDetail.searches + userDetail.carts + userDetail.wishlists) || 1;
                      const pct = Math.round((userDetail[k] / total) * 100);
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim, width: 64, textTransform: "capitalize" }}>{k}</span>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: PALETTE[k], borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: D.mono, fontSize: "0.75rem", color: D.text, width: 36, textAlign: "right" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent signals */}
                <div>
                  <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim, marginBottom: "0.85rem" }}>
                    Recent Signals
                  </p>
                  {userDetail.recentSignals.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "2rem", fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim }}>
                      No recorded signals
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {userDetail.recentSignals.slice(0, 40).map((s) => (
                        <div key={s.id} style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.6rem 0.85rem",
                          background: D.panel,
                          border: `1px solid ${D.border}`,
                          borderRadius: 3,
                        }}>
                          <SignalIcon type={s.type} />
                          <span style={{
                            fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em",
                            textTransform: "capitalize", color: PALETTE[s.type] ?? D.muted,
                            width: 56, flexShrink: 0,
                          }}>{s.type}</span>
                          <span style={{ flex: 1, fontFamily: D.mono, fontSize: "0.72rem", color: D.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.searchQuery || s.productId || <span style={{ color: D.dim }}>—</span>}
                          </span>
                          <span style={{ fontFamily: D.mono, fontSize: "0.68rem", color: D.dim, flexShrink: 0 }}>
                            {fmtDateTime(s.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsUserRow({ u, maxByKey, onSelect }: {
  u: UserSummary;
  maxByKey: (k: SortKey) => number;
  onSelect: () => void;
}) {
  const [h, setH] = useState(false);
  const td: React.CSSProperties = {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.5)",
    fontSize: "0.8rem",
    verticalAlign: "middle",
  };
  return (
    <tr
      onClick={onSelect}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ background: h ? "rgba(255,255,255,0.025)" : "transparent", cursor: "pointer", transition: "background 0.15s" }}
    >
      <td style={{ ...td, paddingLeft: "1.25rem" }}>
        <p style={{ color: "#fff", fontWeight: 600, fontSize: "0.82rem", marginBottom: 3 }}>
          {u.name ?? <span style={{ color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No name</span>}
        </p>
        <p style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>{u.email}</p>
      </td>
      {(["views", "searches", "carts", "wishlists"] as const).map((k) => {
        const pct = Math.round((u[k] / maxByKey(k)) * 100);
        return (
          <td key={k} style={{ ...td, textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
              <div style={{ width: 48, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: PALETTE[k], borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "monospace", color: "#fff", minWidth: 20, textAlign: "right" }}>{u[k]}</span>
            </div>
          </td>
        );
      })}
      <td style={{ ...td, textAlign: "right", color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>{u.total}</td>
      <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
        {u.last_active ? new Date(u.last_active).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
      </td>
      <td style={{ ...td, paddingRight: "0.75rem", color: h ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }}>
        <ChevronRight size={14} />
      </td>
    </tr>
  );
}
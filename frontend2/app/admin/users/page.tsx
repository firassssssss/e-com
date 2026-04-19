// "use client";
// import Link from 'next/link';
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/lib/api";
// import { Eye, Shield, ShieldOff, UserMinus } from "lucide-react";

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   emailVerified: boolean;
//   createdAt: string;
// }

// export default function AdminUsersPage() {
//   const router = useRouter();
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentUserRole, setCurrentUserRole] = useState<string>("");

//   useEffect(() => {
//     Promise.all([
//       api.get("/api/admin/users"),
//       api.get("/api/v1/users/me")
//     ]).then(([usersRes, meRes]) => {
//       setUsers(usersRes.data.data);
//       setCurrentUserRole(meRes.data.data.role);
//     }).finally(() => setLoading(false));
//   }, []);

//   const promoteUser = async (userId: string, newRole: string) => {
//     await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
//     setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
//   };

//   const suspendUser = async (userId: string) => {
//     if (!confirm("Are you sure you want to suspend this user?")) return;
//     await api.delete(`/api/admin/users/${userId}`);
//     setUsers(users.filter(u => u.id !== userId));
//   };

//   if (loading) return <div className="p-8">Loading users...</div>;

//   const isSuperAdmin = currentUserRole === "super_admin";

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-light text-[#1A1410] mb-6">User Management</h1>
//       <div className="bg-white rounded-sm border border-[#E0D5C8] overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-[#F0EAE2] text-[#6B4F3A] text-left">
//             <tr>
//               <th className="px-6 py-4 font-medium">Name</th>
//               <th className="px-6 py-4 font-medium">Email</th>
//               <th className="px-6 py-4 font-medium">Role</th>
//               <th className="px-6 py-4 font-medium">Verified</th>
//               <th className="px-6 py-4 font-medium">Joined</th>
//               {isSuperAdmin && <th className="px-6 py-4 font-medium">Actions</th>}
//               <th className="px-6 py-4 font-medium">View</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map((user) => (
//               <tr key={user.id} className="border-t border-[#E0D5C8] hover:bg-[#FAF7F2]">
//                 <td className="px-6 py-4">{user.name}</td>
//                 <td className="px-6 py-4">{user.email}</td>
//                 <td className="px-6 py-4">
//                   <span className={`px-2 py-1 text-xs rounded-full ${
//                     user.role === "admin" || user.role === "super_admin"
//                       ? "bg-[#C4786A]/20 text-[#C4786A]" 
//                       : "bg-[#E0D5C8]/50 text-[#6B4F3A]"
//                   }`}>
//                     {user.role}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4">{user.emailVerified ? "✅" : "❌"}</td>
//                 <td className="px-6 py-4 text-[#6B4F3A]/60">
//                   {new Date(user.createdAt).toLocaleDateString()}
//                 </td>
//                 {isSuperAdmin && (
//                   <td className="px-6 py-4">
//                     <div className="flex gap-2">
//                       {user.role !== "admin" && user.role !== "super_admin" && (
//                         <button onClick={() => promoteUser(user.id, "admin")} className="p-1 hover:text-[#C4786A]" title="Promote to admin">
//                           <Shield size={16} />
//                         </button>
//                       )}
//                       {user.role === "admin" && (
//                         <button onClick={() => promoteUser(user.id, "user")} className="p-1 hover:text-[#C4786A]" title="Demote to user">
//                           <ShieldOff size={16} />
//                         </button>
//                       )}
//                       <button onClick={() => suspendUser(user.id)} className="p-1 hover:text-red-500" title="Suspend user">
//                         <UserMinus size={16} />
//                       </button>
//                     </div>
//                   </td>
//                 )}
//                 <td className="px-6 py-4">
//                   <Link href={`/admin/users/${user.id}`} className="p-1 hover:text-[#C4786A]" title="View user details">
//                     <Eye size={16} />
//                   </Link>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Eye, Shield, ShieldOff, UserMinus, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0A0A0F",
    color: "#fff",
    padding: "0",
  },
  header: {
    marginBottom: "2rem",
  },
  title: {
    fontFamily: "'Syncopate', sans-serif",
    fontSize: "1.1rem",
    letterSpacing: "0.25em",
    textTransform: "uppercase" as const,
    color: "#fff",
    fontWeight: 700,
    marginBottom: "0.4rem",
  },
  subtitle: {
    fontFamily: "'Syncopate', sans-serif",
    fontSize: "0.5rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#111118",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    padding: "0.65rem 1rem",
    marginBottom: "1.5rem",
    maxWidth: "420px",
    transition: "border-color 0.2s",
  },
  searchInput: {
    background: "none",
    border: "none",
    outline: "none",
    color: "#fff",
    fontFamily: "'Syncopate', sans-serif",
    fontSize: "0.55rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    flex: 1,
    minWidth: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.75rem",
  },
  thead: {
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  th: {
    fontFamily: "'Syncopate', sans-serif",
    fontSize: "0.48rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.35)",
    padding: "0.85rem 1rem",
    textAlign: "left" as const,
    fontWeight: 400,
  },
  td: {
    padding: "0.95rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.8)",
    fontFamily: "monospace",
    fontSize: "0.78rem",
  },
  nameCell: {
    padding: "0.95rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.82rem",
  },
  idCell: {
    padding: "0.95rem 1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "rgba(255,95,31,0.7)",
    fontFamily: "monospace",
    fontSize: "0.68rem",
    letterSpacing: "0.05em",
  },
  emptyRow: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "rgba(255,255,255,0.2)",
    fontFamily: "'Syncopate', sans-serif",
    fontSize: "0.5rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
  },
};

function RoleBadge({ role }: { role: string }) {
  const isElevated = role === "admin" || role === "super_admin";
  return (
    <span style={{
      display: "inline-block",
      padding: "0.25rem 0.6rem",
      borderRadius: "2px",
      fontFamily: "'Syncopate', sans-serif",
      fontSize: "0.42rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      background: isElevated ? "rgba(255,95,31,0.12)" : "rgba(255,255,255,0.06)",
      color: isElevated ? "#FF5F1F" : "rgba(255,255,255,0.45)",
      border: `1px solid ${isElevated ? "rgba(255,95,31,0.3)" : "rgba(255,255,255,0.1)"}`,
    }}>
      {role}
    </span>
  );
}

function ActionBtn({
  onClick, title, color = "rgba(255,255,255,0.4)", children
}: {
  onClick: () => void;
  title: string;
  color?: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0.35rem",
        color: hovered ? color : "rgba(255,255,255,0.25)",
        transition: "color 0.15s",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/users"),
      api.get("/api/v1/users/me"),
    ]).then(([usersRes, meRes]) => {
      setUsers(usersRes.data.data);
      setCurrentUserRole(meRes.data.data.role);
    }).finally(() => setLoading(false));
  }, []);

  const promoteUser = async (userId: string, newRole: string) => {
    await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const suspendUser = async (userId: string) => {
    if (!confirm("Suspend this user?")) return;
    await api.delete(`/api/admin/users/${userId}`);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, query]);

  const isSuperAdmin = currentUserRole === "super_admin";

  if (loading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Syncopate', sans-serif", fontSize: "0.5rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
          Loading users...
        </p>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <p style={S.title}>User Management</p>
        <p style={S.subtitle}>{users.length} registered accounts</p>
      </div>

      {/* Search */}
      <div
        style={{
          ...S.searchWrap,
          borderColor: searchFocused ? "rgba(255,95,31,0.5)" : "rgba(255,255,255,0.1)",
          boxShadow: searchFocused ? "0 0 0 2px rgba(255,95,31,0.08)" : "none",
        }}
      >
        <Search size={13} color={searchFocused ? "#FF5F1F" : "rgba(255,255,255,0.3)"} style={{ flexShrink: 0 }} />
        <input
          style={S.searchInput}
          placeholder="Search by name or ID..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.3)", fontSize: "0.9rem", padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "2rem", marginBottom: "1.5rem",
        paddingBottom: "1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {[
          { label: "Total", value: users.length },
          { label: "Admins", value: users.filter(u => u.role === "admin" || u.role === "super_admin").length },
          { label: "Verified", value: users.filter(u => u.emailVerified).length },
          ...(query ? [{ label: "Results", value: filtered.length }] : []),
        ].map(stat => (
          <div key={stat.label}>
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: "1rem", fontWeight: 700,
              color: "#FF5F1F",
              lineHeight: 1,
              marginBottom: "0.3rem",
            }}>
              {stat.value}
            </p>
            <p style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: "0.42rem", letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
            }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        <table style={S.table}>
          <thead style={S.thead}>
            <tr>
              <th style={S.th}>Name</th>
              <th style={S.th}>ID</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Role</th>
              <th style={S.th}>Verified</th>
              <th style={S.th}>Joined</th>
              {isSuperAdmin && <th style={S.th}>Actions</th>}
              <th style={S.th}>View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 8 : 7} style={S.emptyRow}>
                  No users match "{query}"
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSuperAdmin={isSuperAdmin}
                  onPromote={promoteUser}
                  onSuspend={suspendUser}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user, isSuperAdmin, onPromote, onSuspend
}: {
  user: User;
  isSuperAdmin: boolean;
  onPromote: (id: string, role: string) => void;
  onSuspend: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <td style={S.nameCell}>{user.name}</td>
      <td style={S.idCell}>{user.id.slice(0, 8)}…</td>
      <td style={S.td}>{user.email}</td>
      <td style={{ ...S.td, padding: "0.95rem 1rem" }}>
        <RoleBadge role={user.role} />
      </td>
      <td style={{ ...S.td, color: user.emailVerified ? "#00FFAA" : "rgba(255,80,80,0.7)" }}>
        {user.emailVerified ? "● verified" : "○ pending"}
      </td>
      <td style={{ ...S.td, color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
        {new Date(user.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric"
        })}
      </td>
      {isSuperAdmin && (
        <td style={{ ...S.td, padding: "0.95rem 1rem" }}>
          <div style={{ display: "flex", gap: "0.1rem" }}>
            {user.role !== "admin" && user.role !== "super_admin" && (
              <ActionBtn onClick={() => onPromote(user.id, "admin")} title="Promote to admin" color="#FF5F1F">
                <Shield size={14} />
              </ActionBtn>
            )}
            {user.role === "admin" && (
              <ActionBtn onClick={() => onPromote(user.id, "user")} title="Demote to user" color="#FF5F1F">
                <ShieldOff size={14} />
              </ActionBtn>
            )}
            <ActionBtn onClick={() => onSuspend(user.id)} title="Suspend user" color="rgba(255,80,80,0.9)">
              <UserMinus size={14} />
            </ActionBtn>
          </div>
        </td>
      )}
      <td style={{ ...S.td, padding: "0.95rem 1rem" }}>
        <Link
          href={`/admin/users/${user.id}`}
          style={{
            color: "rgba(255,255,255,0.25)",
            display: "inline-flex",
            alignItems: "center",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#00FFFF")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          title="View user details"
        >
          <Eye size={14} />
        </Link>
      </td>
    </tr>
  );
}
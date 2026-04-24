"use client";

import { useState } from "react";
import { Search, MoreHorizontal, UserCheck, UserX, Trash2, ChevronDown } from "lucide-react";

const MOCK_USERS = [
  { id: "1", name: "Sofia Laurent", email: "sofia@example.com", role: "user", status: "active", joined: "Jan 12, 2026", orders: 5 },
  { id: "2", name: "Amara Kofi", email: "amara@example.com", role: "user", status: "active", joined: "Feb 3, 2026", orders: 12 },
  { id: "3", name: "Priya Mehta", email: "priya@example.com", role: "admin", status: "active", joined: "Dec 20, 2025", orders: 0 },
  { id: "4", name: "James O'Brien", email: "james@example.com", role: "user", status: "inactive", joined: "Mar 1, 2026", orders: 1 },
  { id: "5", name: "Lena Fischer", email: "lena@example.com", role: "user", status: "active", joined: "Feb 28, 2026", orders: 7 },
  { id: "6", name: "Yuki Tanaka", email: "yuki@example.com", role: "user", status: "active", joined: "Jan 5, 2026", orders: 3 },
];

const STATS = [
  { label: "Total Users", value: "2,841" },
  { label: "Active Today", value: "184" },
  { label: "New This Month", value: "312" },
  { label: "Admin Users", value: "5" },
];

export default function UsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || (filter === "Admin" ? u.role === "admin" : filter === "Active" ? u.status === "active" : u.status === "inactive");
    return matchSearch && matchFilter;
  });

  const toggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
    setOpenMenu(null);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setOpenMenu(null);
  };

  return (
    <div className="p-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-[#6B4F3A]/40 uppercase mb-2">Management</p>
        <h1 className="font-display text-4xl font-light text-[#1A1410]">Users</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-10">
        {STATS.map((s, i) => (
          <div key={i} className="border border-[#E0D5C8] p-6">
            <p className="font-display text-3xl font-light text-[#C4786A] mb-1">{s.value}</p>
            <p className="text-xs tracking-widest text-[#6B4F3A]/50 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B4F3A]/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-[#E0D5C8] bg-transparent text-sm text-[#1A1410] placeholder-[#6B4F3A]/30 focus:outline-none focus:border-[#C4786A] w-64 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Active", "Inactive", "Admin"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs tracking-widest px-4 py-2.5 border transition-all ${
                  filter === f ? "bg-[#1A1410] text-[#FAF7F2] border-[#1A1410]" : "border-[#E0D5C8] text-[#6B4F3A] hover:border-[#C4786A]"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-[#6B4F3A]/40 tracking-widest">{filtered.length} users</p>
      </div>

      {/* Table */}
      <div className="border border-[#E0D5C8] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0D5C8] bg-[#F5F0EA]">
              {["User", "Role", "Status", "Joined", "Orders", ""].map((h, i) => (
                <th key={i} className="text-left text-xs tracking-widest text-[#6B4F3A]/50 uppercase px-6 py-4 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-[#E0D5C8] hover:bg-[#FAF7F2] transition-colors last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E8C4B8] flex items-center justify-center text-[#6B4F3A] font-display text-sm">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1410]">{user.name}</p>
                      <p className="text-xs text-[#6B4F3A]/50">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs tracking-widest px-3 py-1 border ${user.role === "admin" ? "border-[#C4786A]/40 text-[#C4786A] bg-[#C4786A]/5" : "border-[#E0D5C8] text-[#6B4F3A]/60"}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-[#8A9E8A]" : "bg-[#E0D5C8]"}`} />
                    <span className="text-xs text-[#6B4F3A]/70 capitalize">{user.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-[#6B4F3A]/60">{user.joined}</td>
                <td className="px-6 py-4 text-sm text-[#1A1410]">{user.orders}</td>
                <td className="px-6 py-4 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                    className="p-1.5 hover:bg-[#F0EAE2] rounded transition-colors"
                  >
                    <MoreHorizontal size={16} className="text-[#6B4F3A]/50" />
                  </button>
                  {openMenu === user.id && (
                    <div className="absolute right-6 top-12 bg-white border border-[#E0D5C8] shadow-lg z-10 min-w-[160px]">
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs tracking-wider text-[#6B4F3A] hover:bg-[#FAF7F2] transition-colors"
                      >
                        {user.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs tracking-wider text-red-500 hover:bg-red-50 transition-colors border-t border-[#E0D5C8]"
                      >
                        <Trash2 size={14} /> Delete user
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

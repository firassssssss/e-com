"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, AlertTriangle, CheckCircle, Eye, ShoppingCart, Search, Heart } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  skinType: string;
  hairType: string;
  skinConcerns: string;
  createdAt: string;
}

interface ActivitySummary {
  views: number;
  searches: number;
  carts: number;
  wishlists: number;
  recentSignals: any[];
}

interface ChatMessage {
  id: string;
  userMessage: string;
  botMessages: any[];
  createdAt: string;
  suspicious: boolean;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'chat'>('activity');

  useEffect(() => {
    Promise.all([
      api.get(`/api/admin/users`).then(res => res.data.data.find((u: any) => u.id === id)),
      api.get(`/api/admin/users/${id}/activity`),
      api.get(`/api/admin/users/${id}/chat`),
    ]).then(([user, act, chat]) => {
      setProfile(user);
      setActivity(act.data.data);
      setMessages(chat.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading user data...</div>;
  if (!profile) return <div className="p-8">User not found</div>;

  const suspiciousCount = messages.filter(m => m.suspicious).length;

  return (
    <div className="p-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[#6B4F3A] hover:text-[#C4786A]">
        <ArrowLeft size={16} /> Back to users
      </button>

      <div className="bg-white p-6 rounded-sm border border-[#E0D5C8]">
        <h1 className="text-2xl font-light mb-2">{profile.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-[#6B4F3A]/60">Email:</span> {profile.email}</div>
          <div><span className="text-[#6B4F3A]/60">Role:</span> {profile.role}</div>
          <div><span className="text-[#6B4F3A]/60">Skin:</span> {profile.skinType} / {profile.hairType}</div>
          <div><span className="text-[#6B4F3A]/60">Concerns:</span> {profile.skinConcerns}</div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[#E0D5C8]">
        <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 text-sm ${activeTab === 'activity' ? 'border-b-2 border-[#C4786A] text-[#1A1410]' : 'text-[#6B4F3A]/60'}`}>
          Activity Overview
        </button>
        <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 text-sm flex items-center gap-2 ${activeTab === 'chat' ? 'border-b-2 border-[#C4786A] text-[#1A1410]' : 'text-[#6B4F3A]/60'}`}>
          Chat History
          {suspiciousCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{suspiciousCount}</span>}
        </button>
      </div>

      {activeTab === 'activity' && activity && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={Eye} label="Views" value={activity.views} />
            <StatCard icon={Search} label="Searches" value={activity.searches} />
            <StatCard icon={ShoppingCart} label="Cart Adds" value={activity.carts} />
            <StatCard icon={Heart} label="Wishlist" value={activity.wishlists} />
          </div>
          <div className="bg-white rounded-sm border border-[#E0D5C8] p-4">
            <h3 className="font-medium mb-3">Recent Signals</h3>
            <table className="w-full text-sm">
              <thead className="text-left text-[#6B4F3A]/60">
                <tr><th>Type</th><th>Product</th><th>Time</th></tr>
              </thead>
              <tbody>
                {activity.recentSignals.slice(0, 20).map((s: any, i: number) => (
                  <tr key={i} className="border-t border-[#E0D5C8]">
                    <td className="py-2 capitalize">{s.type}</td>
                    <td>{s.productId || s.searchQuery || '—'}</td>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white rounded-sm border border-[#E0D5C8] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F0EAE2] text-left">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Bot Reply</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg.id} className={`border-t border-[#E0D5C8] ${msg.suspicious ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(msg.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={msg.userMessage}>{msg.userMessage}</td>
                  <td className="px-4 py-3 max-w-md truncate">{msg.botMessages?.[0]?.text || '—'}</td>
                  <td className="px-4 py-3">
                    {msg.suspicious ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> Suspicious</span> : <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Clean</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-white p-4 rounded-sm border border-[#E0D5C8] flex items-center gap-3">
      <Icon size={20} className="text-[#C4786A]" />
      <div>
        <div className="text-2xl font-light">{value}</div>
        <div className="text-xs text-[#6B4F3A]/60">{label}</div>
      </div>
    </div>
  );
}

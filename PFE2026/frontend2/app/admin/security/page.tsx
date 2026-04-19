"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string | null;
  userMessage: string;
  botMessages: any[];
  createdAt: string;
  suspicious: boolean;
}

export default function AdminSecurityPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchMessages = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (showOnlySuspicious) params.append("suspiciousOnly", "true");
    if (selectedUserId) params.append("userId", selectedUserId);
    params.append("limit", "100");
    
    api.get(`/api/admin/chat/messages?${params.toString()}`)
      .then(res => setMessages(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(); }, [showOnlySuspicious, selectedUserId]);

  const suspiciousCount = messages.filter(m => m.suspicious).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-[#C4786A]" size={28} />
          <h1 className="text-3xl font-light text-[#1A1410]">Security Audit</h1>
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlySuspicious}
              onChange={e => setShowOnlySuspicious(e.target.checked)}
              className="accent-[#C4786A]"
            />
            Show only suspicious
          </label>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 text-sm bg-[#F0EAE2] hover:bg-[#E0D5C8] rounded-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {suspiciousCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-sm flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={20} />
          <span className="text-red-800">
            <strong>{suspiciousCount}</strong> suspicious message(s) detected. Review immediately.
          </span>
        </div>
      )}

      <div className="bg-white rounded-sm border border-[#E0D5C8] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F0EAE2] text-[#6B4F3A] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">User ID</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center">Loading...</td></tr>
            ) : messages.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6B4F3A]/60">No messages found</td></tr>
            ) : (
              messages.map(msg => (
                <tr key={msg.id} className={`border-t border-[#E0D5C8] ${msg.suspicious ? "bg-red-50/30" : "hover:bg-[#FAF7F2]"}`}>
                  <td className="px-4 py-3 text-[#6B4F3A]/70 whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {msg.userId ? msg.userId.slice(0, 8) + "…" : "anon"}
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <div className="truncate" title={msg.userMessage}>
                      {msg.userMessage}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {msg.suspicious ? (
                      <span className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertTriangle size={12} /> Suspicious
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle size={12} /> Clean
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedUserId(msg.userId)}
                      className="text-xs text-[#C4786A] hover:underline"
                    >
                      Filter by user
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

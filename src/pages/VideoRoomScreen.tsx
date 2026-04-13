// src/pages/VideoRoomScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { getAuth } from "../utils/auth";
import socketService from "../services/consultationSocket";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

// ── Types ─────────────────────────────────────────────────────
interface ChatMsg {
  sender_id: number;
  message: string;
  timestamp: string;
  isOwn: boolean;
  local?: boolean;
}

interface SharedFile {
  id: number;
  file_name: string;
  description: string;
  record_type: string;
  uploaded_by: string;
  created_at: string;
}

type PanelTab = "chat" | "upload";

const ALLOWED = [
  "application/pdf", "image/jpeg", "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ── Helpers ───────────────────────────────────────────────────
function toIST(utcStr: string): string {
  try {
    const d = new Date(utcStr.replace(" ", "T") + ":00Z");
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
      hour12: true, timeZone: "Asia/Kolkata",
    });
  } catch { return utcStr; }
}

function nowIST(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
    hour12: true, timeZone: "Asia/Kolkata",
  });
}

function fmtSize(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
}

function fmtTimer(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────
export default function VideoRoomScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();

  const {
    consultation_id,
    channel,
    token,
    uid,
    appointment_id,
    role,
  } = (state || {}) as {
    consultation_id?: number;
    channel?: string;
    token?: string;
    uid?: number;
    appointment_id?: number;
    role?: string;
  };

  // ── Agora ──────────────────────────────────────────────────
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<[IMicrophoneAudioTrack, ICameraVideoTrack] | null>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);

  const [joined, setJoined] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState("");

  // ── Timer ──────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Panel ──────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("chat");
  const [unread, setUnread] = useState(0);
  const [newFile, setNewFile] = useState(false);

  // ── Chat ───────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Consultation state ──────────────────────────────────────
  const doctorIdRef = useRef<number | null>(null);
  const patientIdRef = useRef<number | null>(null);
  const [endedPopupVisible, setEndedPopupVisible] = useState(false);

  // ── Upload ─────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upType, setUpType] = useState("Medical Report");
  const [uploading, setUploading] = useState(false);
  const [upResult, setUpResult] = useState<"ok" | "err" | null>(null);
  const [upMsg, setUpMsg] = useState("");

  // ── Shared files ──────────────────────────────────────────
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [filesReady, setFilesReady] = useState(false);
  const filesLoadedOnce = useRef(false);

  // ── Panel state refs (keep callbacks stable) ──────────────
  // These mirror panelOpen/activeTab but are readable inside useCallback
  // without adding those states to the dependency arrays.
  const panelOpenRef = useRef(panelOpen);
  const activeTabRef = useRef<PanelTab>(activeTab);
  useEffect(() => { panelOpenRef.current = panelOpen; }, [panelOpen]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Reset timer when remote user disconnects / reconnects
  useEffect(() => {
    if (!hasRemote) setElapsed(0);
  }, [hasRemote]);

  // ── Helpers ─────────────────────────────────────────────────
  function isOwnMsg(sender_id: number): boolean {
    const sid = Number(sender_id);
    if (role === "doctor" && doctorIdRef.current !== null) return sid === doctorIdRef.current;
    if (role === "patient" && patientIdRef.current !== null) return sid === patientIdRef.current;
    return sid === Number(auth?.user_id);
  }

  // ─────────────────────────────────────────────────────────────
  // Load initial consultation details
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appointment_id) return;
    fetch(`/api/consultation/details/${appointment_id}`)
      .then(r => r.json())
      .then(d => {
        doctorIdRef.current = Number(d.doctor_id);
        patientIdRef.current = Number(d.patient_id);
      })
      .catch(() => { });
  }, [appointment_id]); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────
  // Polling Logic for Chat vs Files
  // ─────────────────────────────────────────────────────────────
  const fetchChat = useCallback(async () => {
    if (!consultation_id) return;
    try {
      const res = await fetch(`/api/consultation/chat/${consultation_id}`);
      if (!res.ok) return;
      const data = await res.json() as { sender_id: number; message: string; timestamp: string }[];

      setMessages(prev => {
        const serverCount = data.length;
        const prevServer = prev.filter(m => !m.local).length;
        const newCount = serverCount - prevServer;

        // Read from refs — avoids adding panelOpen/activeTab to the dep array
        if (newCount > 0 && !(panelOpenRef.current && activeTabRef.current === "chat")) {
          setUnread(u => u + newCount);
        }

        return data.map(m => ({
          ...m,
          isOwn: isOwnMsg(m.sender_id),
        }));
      });
    } catch { /* silent */ }
  }, [consultation_id]); // ← stable dep only — panelOpen/activeTab read via refs

  const fetchFiles = useCallback(async () => {
    if (!appointment_id || !auth) return;
    try {
      const url = `/api/medical-records?appointment_id=${appointment_id}&role=${role}&user_id=${auth.user_id}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json() as SharedFile[];

      setFiles(prev => {
        // Read from refs — avoids adding panelOpen/activeTab to the dep array
        if (data.length > prev.length && !(panelOpenRef.current && activeTabRef.current === "upload")) {
          setNewFile(true);
        }
        return data;
      });
      // Mark ready outside the setState to avoid double-firing
      if (!filesLoadedOnce.current) {
        filesLoadedOnce.current = true;
        setFilesReady(true);
      }
    } catch { /* silent */ }
  }, [appointment_id, role, auth]); // ← stable deps only — panelOpen/activeTab read via refs

  const chatPollRef = useRef<any>(null);
  const filePollRef = useRef<any>(null);

  useEffect(() => {
    // Only start polling once BOTH participants are in the call.
    // Prevents flooding the backend before the consultation is live.
    if (!hasRemote) return;

    fetchChat();
    fetchFiles();

    if (!chatPollRef.current) chatPollRef.current = setInterval(fetchChat, 3000);  // 3s
    if (!filePollRef.current) filePollRef.current = setInterval(fetchFiles, 10000); // 10s

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(chatPollRef.current!); chatPollRef.current = null;
        clearInterval(filePollRef.current!); filePollRef.current = null;
      } else {
        fetchChat(); fetchFiles();
        if (!chatPollRef.current) chatPollRef.current = setInterval(fetchChat, 3000);
        if (!filePollRef.current) filePollRef.current = setInterval(fetchFiles, 10000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(chatPollRef.current!); chatPollRef.current = null;
      clearInterval(filePollRef.current!); filePollRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasRemote, fetchChat, fetchFiles]);

  // Auto-scroll
  useEffect(() => {
    if (panelOpen && activeTab === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, panelOpen, activeTab]);

  // Clear badges
  useEffect(() => {
    if (panelOpen && activeTab === "chat") setUnread(0);
    if (panelOpen && activeTab === "upload") setNewFile(false);
  }, [panelOpen, activeTab]);

  // ─────────────────────────────────────────────────────────────
  // Socket Listener for consultation_ended (Patient only)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role !== "patient") return;

    const handleEnd = async () => {
      setEndedPopupVisible(true);

      // Stop all polling immediately
      clearInterval(chatPollRef.current); chatPollRef.current = null;
      clearInterval(filePollRef.current); filePollRef.current = null;

      // Leave Agora gracefully
      try { await clientRef.current?.leave(); } catch { }
      try { tracksRef.current?.[0].stop(); tracksRef.current?.[0].close(); } catch { }
      try { tracksRef.current?.[1].stop(); tracksRef.current?.[1].close(); } catch { }

      setTimeout(() => {
        navigate("/consultation/prescription-waiting", {
          state: { appointment_id: appointment_id, consultation_id: consultation_id },
          replace: true,
        });
      }, 2500);
    };

    socketService.on("consultation_ended", handleEnd);
    return () => { socketService.off("consultation_ended", handleEnd); };
  }, [role, appointment_id, consultation_id, navigate]);

  // ── Timer ──────────────────────────────────────────────────
  // Starts only when the remote participant is actually present,
  // so both sides show the same elapsed time from the same moment.
  useEffect(() => {
    if (hasRemote) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      // Stop (and implicitly reset via the hasRemote→false effect above)
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasRemote]);

  // ── Send message ──────────────────────────────────────────
  async function sendMessage() {
    const text = msgInput.trim();
    if (!text || !consultation_id || !auth || sending) return;
    setSending(true);

    const opt: ChatMsg = {
      sender_id: auth.user_id,
      message: text,
      timestamp: nowIST(),
      isOwn: true,
      local: true,
    };
    setMessages(p => [...p, opt]);
    setMsgInput("");

    try {
      await fetch("/api/consultation/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation_id,
          sender_id: auth.user_id,
          message: text,
        }),
      });
      await fetchChat();
    } catch {
      setMessages(p => p.filter(m => m !== opt));
    } finally { setSending(false); }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ── File handling ──────────────────────────────────────────
  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUpResult(null); setUpMsg("");
    if (!ALLOWED.includes(f.type)) {
      setUpResult("err"); setUpMsg("Only PDF, JPG, PNG, DOC, DOCX allowed"); return;
    }
    if (f.size > 16 * 1024 * 1024) {
      setUpResult("err"); setUpMsg("File must be under 16 MB"); return;
    }
    setUpFile(f);
  }

  async function doUpload() {
    if (!upFile || !auth || uploading) return;
    setUploading(true); setUpResult(null);
    try {
      const fd = new FormData();
      fd.append("user_id", String(auth.user_id));
      fd.append("role", role || auth.role || "patient");
      fd.append("file", upFile);
      fd.append("record_type", upType);
      if (appointment_id) fd.append("appointment_id", String(appointment_id));

      const res = await fetch("/api/medical-record/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUpResult("err"); setUpMsg(data.error || "Upload failed.");
      } else {
        setUpResult("ok");
        setUpMsg("Uploaded! The other participant can now see it below.");
        setUpFile(null);
        if (fileRef.current) fileRef.current.value = "";
        fetchFiles();
      }
    } catch {
      setUpResult("err"); setUpMsg("Upload failed. Check your connection.");
    } finally { setUploading(false); }
  }

  // ── Agora join ────────────────────────────────────────────
  useEffect(() => {
    if (!channel || !token || !uid) { setError("Missing call data."); return; }
    joinCall();
    return () => {
      // Full cleanup on unmount — stop polls, close Agora
      clearInterval(chatPollRef.current!); chatPollRef.current = null;
      clearInterval(filePollRef.current!); filePollRef.current = null;
      clearInterval(timerRef.current!); timerRef.current = null;
      try { tracksRef.current?.[0].stop(); tracksRef.current?.[0].close(); } catch { }
      try { tracksRef.current?.[1].stop(); tracksRef.current?.[1].close(); } catch { }
      clientRef.current?.leave().catch(() => { });
    };
  }, []); // eslint-disable-line

  async function joinCall() {
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user: IAgoraRTCRemoteUser, mt) => {
        await client.subscribe(user, mt);
        if (mt === "video") {
          setHasRemote(true);
          setTimeout(() => {
            if (remoteRef.current) {
              remoteRef.current.innerHTML = "";
              user.videoTrack?.play(remoteRef.current);
            }
          }, 100);
        }
        if (mt === "audio") user.audioTrack?.play();
      });
      client.on("user-unpublished", (_u, mt) => { if (mt === "video") setHasRemote(false); });
      client.on("user-left", () => setHasRemote(false));

      await client.join(APP_ID, channel!, token!, Number(uid));
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: "music_standard" }, { encoderConfig: "360p_7" }
      );
      tracksRef.current = tracks;
      if (localRef.current) tracks[1].play(localRef.current);
      await client.publish(tracks);
      setJoined(true);
    } catch (e: unknown) {
      setError(`Could not join: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function leaveCall() {
    // Stop timer
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Close tracks safely
    try { tracksRef.current?.[0].stop(); tracksRef.current?.[0].close(); } catch { }
    try { tracksRef.current?.[1].stop(); tracksRef.current?.[1].close(); } catch { }
    tracksRef.current = null;
    // Leave Agora safely
    try { await clientRef.current?.leave(); } catch (e) { console.warn("Agora leave:", e); }
    clientRef.current = null;
  }

  async function endCall() {
    // 1. Stop all polling immediately
    clearInterval(chatPollRef.current); chatPollRef.current = null;
    clearInterval(filePollRef.current); filePollRef.current = null;

    // 2. Leave Agora
    await leaveCall();

    if (role === "doctor") {
      // 3. Notify backend
      try {
        await fetch("/api/consultation/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultation_id: consultation_id }),
        });
      } catch (e) {
        console.warn("End consultation API failed (navigating anyway):", e);
      }
      // 4. Navigate to prescription screen no matter what
      navigate("/prescription/create", {
        state: {
          consultation_id: consultation_id,
          appointment_id: appointment_id,
          patient_id: patientIdRef.current,
        },
        replace: true,
      });
    } else {
      navigate("/upcoming-appointments", { replace: true });
    }
  }

  async function toggleMic() {
    if (!tracksRef.current) return;
    const n = !micOn; await tracksRef.current[0].setEnabled(n); setMicOn(n);
  }
  async function toggleCam() {
    if (!tracksRef.current) return;
    const n = !camOn; await tracksRef.current[1].setEnabled(n); setCamOn(n);
  }

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center p-6">
        <p className="text-5xl mb-4">📵</p>
        <p className="text-red-400 font-medium mb-2">Connection Failed</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-xl">
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── VIDEO AREA ─────────────────────────────────── */}
        <div className={`relative bg-black transition-all duration-300 ${panelOpen ? "flex-1" : "w-full"}`}>

          {/* Remote video */}
          <div ref={remoteRef} className="absolute inset-0"
            style={{ display: hasRemote ? "block" : "none" }} />

          {/* Placeholder */}
          {!hasRemote && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <p className="text-sm">Waiting for other participant...</p>
              {joined && <p className="text-xs text-gray-500 mt-1">You are connected.</p>}
            </div>
          )}

          {/* Local PIP */}
          <div ref={localRef}
            className="absolute bottom-4 right-4 w-36 h-28 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-700 shadow-lg z-10" />

          {/* Top bar: status + timer */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${joined ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${joined ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
              {joined ? "Connected" : "Connecting..."}
            </span>
            {joined && (
              <span className="inline-flex items-center gap-1 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-mono">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" />
                </svg>
                {fmtTimer(elapsed)}
              </span>
            )}
          </div>
        </div>

        {/* ── SIDE PANEL ─────────────────────────────────── */}
        {panelOpen && (
          <div className="w-80 flex flex-col border-l border-gray-700" style={{ backgroundColor: "#1a1f2e" }}>

            {/* Tab headers */}
            <div className="flex items-center border-b border-gray-700 flex-shrink-0">
              <button onClick={() => setActiveTab("chat")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "chat" ? "text-white border-primary" : "text-gray-400 border-transparent hover:text-gray-200"
                  }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                Chat {unread > 0 && <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>}
              </button>
              <button onClick={() => setActiveTab("upload")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "upload" ? "text-white border-primary" : "text-gray-400 border-transparent hover:text-gray-200"
                  }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                </svg>
                Files {newFile && <span className="w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <button onClick={() => setPanelOpen(false)} className="px-3 text-gray-400 hover:text-white py-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* ── CHAT TAB ─────────────────────────────────── */}
            {activeTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
                  style={{ background: "#0d1117" }}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                      <p>No messages yet. Say hello! 👋</p>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <div key={i} className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] px-3 py-2 text-sm ${m.isOwn
                            ? "bg-primary text-white rounded-2xl rounded-br-sm"
                            : "bg-gray-700 text-gray-100 rounded-2xl rounded-bl-sm"
                          } ${m.local ? "opacity-60" : ""}`}>
                          <p className="leading-relaxed break-words">{m.message}</p>
                          <p className={`text-right text-xs mt-0.5 ${m.isOwn ? "text-white/50" : "text-gray-400"}`}>
                            {m.local ? nowIST() : toIST(m.timestamp)}
                            {m.local && " ·"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="p-2 border-t border-gray-700 flex-shrink-0 bg-gray-900">
                  <div className="flex items-end gap-2">
                    <textarea value={msgInput} onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={onKey} placeholder="Type a message..." rows={1}
                      className="flex-1 bg-gray-800 text-white text-sm rounded-2xl px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500"
                      style={{ minHeight: "40px", maxHeight: "80px" }} />
                    <button onClick={sendMessage} disabled={!msgInput.trim() || sending}
                      className="w-9 h-9 bg-primary hover:bg-primary-dark disabled:opacity-40 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 px-1">Enter to send</p>
                </div>
              </>
            )}

            {/* ── UPLOAD TAB ───────────────────────────────── */}
            {activeTab === "upload" && (
              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-4 space-y-3 border-b border-gray-700 flex-shrink-0">
                  <select value={upType} onChange={e => setUpType(e.target.value)}
                    className="w-full bg-gray-700 text-white text-sm rounded-xl px-3 py-2 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Medical Report</option>
                    <option>Lab Results</option>
                    <option>X-Ray / Scan</option>
                    <option>Prescription</option>
                    <option>Insurance Document</option>
                    <option>Other</option>
                  </select>
                  <div onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${upFile ? "border-green-500/50 bg-green-500/5" : "border-gray-600 hover:border-primary/50 bg-gray-800/30"
                      }`}>
                    {upFile ? (
                      <div className="space-y-1">
                        <p className="text-xl">📄</p>
                        <p className="text-xs text-green-400 font-medium truncate">{upFile.name}</p>
                        <p className="text-xs text-gray-500">{fmtSize(upFile.size)}</p>
                        <button onClick={e => { e.stopPropagation(); setUpFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                          className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <svg className="w-6 h-6 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                        </svg>
                        <p className="text-xs text-gray-300">Click to select file</p>
                        <p className="text-xs text-gray-500">PDF · JPG · PNG · DOC · Max 16MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden" onChange={onFileSelect} />
                  {upResult && (
                    <div className={`text-xs rounded-xl p-2.5 ${upResult === "ok" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {upResult === "ok" ? "✅" : "❌"} {upMsg}
                    </div>
                  )}
                  <button onClick={doUpload} disabled={!upFile || uploading}
                    className="w-full py-2 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2">
                    {uploading ? "Uploading..." : "⬆ Upload File"}
                  </button>
                </div>
                <div className="p-3 flex-1">
                  {!filesReady ? (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : files.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No files shared yet</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map(f => (
                        <div key={f.id} className="flex items-center gap-2 bg-gray-700/40 rounded-xl p-2.5">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-base">
                            {f.file_name.match(/\.pdf$/i) ? "📄" : "🖼️"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate font-medium">{f.file_name}</p>
                            <p className="text-xs text-gray-400">{f.record_type}</p>
                          </div>
                          <a href={`/api/medical-record/download/${f.id}?user_id=${auth?.user_id}&role=${role}&view=true`}
                            target="_blank" rel="noreferrer" className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" /></svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-center gap-3 py-3 bg-gray-900 border-t border-gray-800 flex-shrink-0">
        <button onClick={toggleMic} className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${micOn ? "bg-gray-700" : "bg-red-500"}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /></svg>
        </button>
        <button onClick={endCall} className="w-13 h-13 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg" style={{ width: 52, height: 52 }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" /></svg>
        </button>
        <button onClick={toggleCam} className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${camOn ? "bg-gray-700" : "bg-red-500"}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
        </button>
        <button onClick={() => { setPanelOpen(p => !p); setActiveTab("chat"); }} className={`w-11 h-11 rounded-full flex items-center justify-center text-white relative ${panelOpen && activeTab === "chat" ? "bg-primary" : "bg-gray-700"}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
          {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">{unread}</span>}
        </button>
        <button onClick={() => { setPanelOpen(p => activeTab === "upload" ? !p : true); setActiveTab("upload"); }} className={`w-11 h-11 rounded-full flex items-center justify-center text-white relative ${panelOpen && activeTab === "upload" ? "bg-primary" : "bg-gray-700"}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>
          {newFile && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />}
        </button>
      </div>

      {/* POPUP */}
      {endedPopupVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Doctor Ended the Call</h2>
            <p className="text-gray-500 text-sm mb-5">
              Your doctor has ended the consultation.<br />
              Taking you to your prescription...
            </p>
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
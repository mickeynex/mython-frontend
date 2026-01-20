import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import topbarBg from "../assets/topbar-bg.png";

export default function Chat() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const room = params.get("room");

  // 🔐 TEMP guest credentials (set by Join.jsx)
  const name = sessionStorage.getItem("guestName");
  const pin = sessionStorage.getItem("guestPin");
  const authOK = sessionStorage.getItem("guestAuthOK");

  const wsRef = useRef(null);
  const hasConnectedRef = useRef(false);

  const [ownerOnline, setOwnerOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!authOK || authOK !== "1") {
      navigate(`/join?room=${room}`);
    }
  }, []);
  //auto scroll
  useEffect(() => {
    const box = document.getElementById("msg-box");
    if (!box) return;

    box.scrollTop = box.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!name || !pin || !room || authOK !== "1") {
      navigate(`/join?room=${room}`);
    }
  }, [name, pin, room, authOK, navigate]);

  useEffect(() => {
    if (hasConnectedRef.current) return;
    hasConnectedRef.current = true;

    const WS_BASE = import.meta.env.VITE_BACKEND_WS;

    const socket = new WebSocket(
      `${WS_BASE}/ws/${room}`
    );


    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        role: "guest"
      }));
    };

    socket.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      if (data.type === "presence") {
        setOwnerOnline(data.owner === true);
        return;
      }

      if (data.text && data.role) {
        setMessages((prev) => [...prev, data]);
      }

      if (data.type === "system" && data.reason === "ROOM_EXPIRED") {
        setExpired(true);
        socket.close();
      }
    };

    socket.onclose = () => {
    };

    socket.onerror = () => {
      socket.close();
    };

    return () => {
      socket.close();
    };
  }, [room, name, pin, navigate]);
  useEffect(() => {
    if (!expired) return;

    const handleUnload = () => {
      sessionStorage.removeItem("guestAuthOK");
      sessionStorage.removeItem("guestName");
      sessionStorage.removeItem("guestPin");
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [expired]);

  const sendMessage = () => {
    if (!msg || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;

    const message = {
      role: "guest",
      text: msg,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // ✅ SHOW MY OWN MESSAGE (WhatsApp behavior)
    setMessages((prev) => [...prev, message]);

    // ✅ SEND TO OWNER
    wsRef.current.send(JSON.stringify(message));

    setMsg("");
  };

  // 🔥 EXPIRY SCREEN (UNCHANGED)
  if (expired) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "white",
          flexDirection: "column",
          textAlign: "center",
          padding: "20px",
          filter: "brightness(0.85)",
        }}
      >
        <span style={{ fontSize: "26px", marginBottom: "14px" }}>⏳</span>

        <h2
          style={{
            fontSize: "21px",
            fontWeight: "500",
            marginBottom: "10px",
            letterSpacing: "0.4px",
          }}
        >
          Room expired
        </h2>

        <p
          style={{
            opacity: 0.65,
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          Ask Mython for a new join link.
        </p>
      </div>
    );
  }

  // 🧠 UI BELOW IS UNTOUCHED
  return (
    <div
      className="h-screen flex flex-col bg-gray-900 text-white"
      style={{
        opacity: 1,
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          height: "64px",
          backgroundImage: `url(${topbarBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(150, 220, 235, 0.05)",
          }}
        />
        <span
          style={{
            position: "relative",
            fontSize: "40px",
            fontWeight: "500",
            color: "rgba(255, 255, 255, 0.35)",
            textShadow: "0 1px 6px rgba(255,255,255,0.5)",
          }}
        >
          Mython Nova
        </span>
      </div>

      {/* STATUS BAR */}
      <div
        style={{
          height: "30px",
          backgroundColor: "#111",
          display: "flex",
          alignItems: "center",
          paddingLeft: "16px",
          borderBottom: "1px solid #444",
          fontSize: "14px",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        {ownerOnline && (
          <span style={{ color: "rgba(80, 200, 120, 0.9)", fontSize: "12px" }}>
            ● Connected to Mython
          </span>
        )}
      </div>

      {/* CHAT BODY */}
      <div
        id="msg-box"
        className="flex-1 overflow-y-auto px-4 py-3 bg-gray-950"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              background: m.role === "guest" ? "#161616" : "#1f1f1f",
              padding: "8px 12px",
              borderRadius: "10px",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              border: "1px solid #2a2a2a",
            }}
          >
            <span style={{ flex: 1, color: "#eaeaea" }}>
              {m.role === "guest" ? "👤 Guest" : "🐍 Mython"}: {m.text}
            </span>
            <span
              style={{
                marginLeft: "12px",
                fontSize: "12px",
                color: "#8a8a8a",
                whiteSpace: "nowrap",
              }}
            >
              {m.time}
            </span>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="border-t border-gray-700 flex items-center px-6 py-3 gap-4 bg-gray-800">
        <input
          value={msg}
          placeholder="Write a message..."
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{
            flex: 1,
            height: "30px",
            padding: "0 16px",
            fontSize: "16px",
            borderRadius: "8px",
            backgroundColor: "#222",
            color: "white",
            border: "1px solid #444",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            height: "28px",
            padding: "0 14px",
            fontSize: "14px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.14)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.18)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.background = "rgba(255,255,255,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.background = "rgba(255,255,255,0.14)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(1px)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

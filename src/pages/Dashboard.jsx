import { useEffect, useState } from "react";
import axios from "axios";
import topbarBg from "../assets/topbar-bg.png";
import ChangePin from "./ChangePin";

export default function Dashboard() {
  const backend = import.meta.env.VITE_BACKEND_HTTP;
  const WS = import.meta.env.VITE_BACKEND_WS;
  const [showControl, setShowControl] = useState(false);
  const [controlView, setControlView] = useState(null); // "change-pin"

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [guestOnline, setGuestOnline] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsRoomId, setSettingsRoomId] = useState(null);
  
  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const scrollToBottomIfNeeded = () => {
    const box = document.getElementById("msg-box");
    if (!box) return;

    const distanceFromBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight;
    const isNearBottom = distanceFromBottom < 80;

    if (isNearBottom) {
      box.scrollTo({
        top: box.scrollHeight - box.clientHeight,
        behavior: "smooth", // change to "smooth" later if you want
      });
    }
  };
  const formatRemaining = (expiresAt) => {
    if (!expiresAt) return "";

    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "00:00:00";

    const totalSeconds = Math.floor(diff / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };
  const formatSeconds = (seconds) => {
    if (seconds == null) return "00:00:00";

    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");

    return `${h}:${m}:${s}`;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const activeRoomData = rooms.find((r) => r.id === activeRoom);
  useEffect(() => {
    if (!activeRoomData?.expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const calculate = () => {
      const diff =
        new Date(activeRoomData.expiresAt + "Z").getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.floor(diff / 1000)));
      if (diff <= 0) {
        // refresh rooms to get new join key & expiry
        loadRooms();
      }
    };

    calculate(); // 🔥 immediate sync on room open / expiry change

    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [activeRoomData?.expiresAt]);

  const loadRooms = async () => {
    const res = await axios.get(`${backend}/rooms/list`);
    setRooms(res.data.rooms);
  };

  // fetch rooms
  useEffect(() => {
    loadRooms();
  }, []);
  //auto scroll
  useEffect(() => {
    const box = document.getElementById("msg-box");
    if (!box) return;

    box.scrollTop = box.scrollHeight;
  }, [messages]);

  // websocket
  useEffect(() => {
    if (!activeRoom) return;
    const socket = new WebSocket(`${WS}/ws/${activeRoom}`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ role: "owner" }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "presence") {
          setGuestOnline(msg.guest === true);
          return;
        }
        // ✅ SHOW INCOMING MESSAGE (FIX)
        if (msg.text && msg.role) {
          setMessages(prev => [...prev, msg]);
          requestAnimationFrame(scrollToBottomIfNeeded);
        }

        // keep room-name auto update
        if (msg.role === "guest" && !activeRoomData?.guestName) {
          loadRooms();
        }
      } catch {}
    };

    setWs(socket);
    return () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [activeRoom]);

  // send message
  const sendMsg = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const input = document.getElementById("msg-input");
    const text = input.value.trim();
    if (!text) return;

    const message = {
      role: "owner",
      text,
      time: timeNow(),
    };

    // show instantly (WhatsApp behavior)
    setMessages(prev => [...prev, message]);

    ws.send(JSON.stringify(message));

    input.value = "";
  };


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
        {/* glass overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(150, 220, 235, 0.05)", // 👈 control this
            backdropFilter: "blur(0px)",
          }}
        />

        {/* title */}
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

      {/* BODY */}
      <div className="flex flex-1 overflow-x-hidden h-full">
        {/* LEFT SIDEBAR */}
        <aside className="w-[320px] bg-gray-800 flex flex-col border-r border-gray-700 z-10">
          <button
            onClick={() => setShowControl(true)}
            style={{
              height: "30px",
              padding: "0 14px",
              fontSize: "15px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.14)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
              marginBottom: "1px",
              backdropFilter: "blur(6px)",
              transition: "all 0.18s ease",
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
            Control Center
          </button>

          {/* CREATE ROOM BUTTON */}
          <button
            onClick={async () => {
              await axios.post(`${backend}/rooms/create`);
              const list = await axios.get(`${backend}/rooms/list`);
              setRooms(list.data.rooms);
            }}
            style={{
              height: "30px",
              padding: "0 14px",
              fontSize: "15px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.14)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              marginBottom: "1.5px",
              transition: "all 0.18s ease",
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
            Create new room
          </button>

          {/* ROOM LIST */}
          <div className="flex-1 px-3 relative">
            {rooms.map((room) => (
              <div
                key={room.id}
                style={{
                  minHeight: "28px",        // 👈 change from height
                  padding: "0 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.14)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  marginBottom: "1.5px",
                  transition: "all 0.18s ease",
                  overflow: "visible",     // 👈 THIS is critical
                  position: "relative",    // 👈 anchor dropdown
                  zIndex:
                    showSettings && settingsRoomId === room.id ? 1000 : 1,
                }}
              >
                {/* ROOM NAME */}
                <span
                  style={{
                    fontSize: "15px",//change
                    color: "white",
                  }}
                >
                  {room.guestName ? `👤 ${room.guestName}` : "⏳ Waiting…"}
                </span>

                {/* ACTION BUTTONS */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    height: "32px",
                    alignItems: "center", // 👈 THIS is important
                  }}
                >
                  {/* CHAT */}
                  <button
                    onClick={() => {
                      setActiveRoom(room.id);
                      setMessages([]);
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
                    style={{
                      height: "28px",
                      padding: "0 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.14)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.18)",
                      cursor: "pointer",
                      backdropFilter: "blur(6px)",
                      transition: "all 0.18s ease",
                    }}
                  >
                    Chat
                  </button>

                  {/* SETTINGS */}
                  <div
                    style={{
                      position: "relative",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        setSettingsRoomId(room.id);
                        setShowSettings((prev) =>
                          prev && settingsRoomId === room.id ? false : true
                        );
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
                      style={{
                        height: "28px",
                        padding: "0 14px",
                        fontSize: "18px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.14)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.18)",
                        cursor: "pointer",
                        backdropFilter: "blur(6px)",
                        transition: "all 0.18s ease",
                      }}
                    >
                      ⚙
                    </button>

                    {showSettings && settingsRoomId === room.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "38px",
                          right: 0,
                          width: "160px",
                          backgroundColor: "#222",
                          border: "1px solid #444",
                          borderRadius: "8px",
                          zIndex: 999,
                        }}
                      >
                        <button
                          onClick={async () => {
                            await axios.delete(`${backend}/rooms/${room.id}`);
                            setShowSettings(false);
                            setActiveRoom(null);
                            const list = await axios.get(`${backend}/rooms/list`);
                            setRooms(list.data.rooms);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "white",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          🗑 Delete room
                        </button>

                        <button
                          onClick={() => setShowSettings(false)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "white",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          ✕ Close
                        </button>
                        <button
                          onClick={async () => {
                            await axios.post(`${backend}/rooms/${room.id}/expire-now`);
                            await loadRooms();
                            setShowSettings(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "#f87171",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          ⚡ Expire now
                        </button>
                        <button
                          onClick={async () => {
                            const hours = prompt("Set expiry in hours (e.g. 1, 12, 24)");
                            if (!hours) return;

                            await axios.post(
                              `${backend}/rooms/${room.id}/set-expiry`,
                              null,
                              { params: { hours: Number(hours) } }
                            );
                            await loadRooms();
                            setShowSettings(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "white",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          ⏱ Adjust expiry
                        </button>

                      </div>
                    )}
                  </div>

                  {/* COPY LINK */}
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/join?room=${room.id}&key=${room.joinKey}`
                      )
                    }
                    style={{
                      height: "28px",
                      padding: "0 14px",
                      fontSize: "15px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.14)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.18)",
                      cursor: "pointer",
                      backdropFilter: "blur(6px)",
                      transition: "all 0.18s ease",
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
                    ⧉
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        {showControl ? (
          <section className="flex-1 flex flex-col bg-gray-950 relative p-6">
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: "20px",
                paddingBottom: "10px",
                color: "rgba(255,255,255,0.85)",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                letterSpacing: "0.5px",
              }}
            >
              Control Center
            </h2>

            {/* CONTROL OPTIONS */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",     // ✅ side-by-side
                gap: "14px",
                paddingLeft: "12px",
                marginBottom: "24px",
              }}
            >
              <button
                onClick={() =>
                  setControlView((prev) => (prev === "change-pin" ? null : "change-pin"))
                }
                style={{
                  width: "220px",
                  padding: "10px",
                  borderRadius: "8px",
                  background:
                    controlView === "change-pin"
                      ? "rgba(120, 200, 220, 0.22)"
                      : "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "white",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  if (controlView !== "change-pin") {
                    e.currentTarget.style.background = "rgba(255,255,255,0.22)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (controlView !== "change-pin") {
                    e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  }
                }}
              >
                Change Dashboard PIN
              </button>
              <button
                onClick={() =>
                  setControlView((prev) => (prev === "login-bg" ? null : "login-bg"))
                }
                style={{
                  width: "220px",
                  padding: "10px",
                  borderRadius: "8px",
                  background:
                    controlView === "login-bg"
                      ? "rgba(120, 200, 220, 0.22)"
                      : "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "white",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  transition: "all 0.18s ease",
                }}
              >
                Login Background Image
              </button>
            </div>

            {/* CONTROL CONTENT */}
            {controlView === "change-pin" && (
              <div style={{ marginTop: "24px" }}>
                <ChangePin />
              </div>
            )}

            {/* CLOSE */}
            <button
              onClick={() => {
                setShowControl(false);
                setControlView(null);
              }}
              style={{
                marginTop: "auto",
                opacity: 0.6,
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
              }}
            >
              ← Back to Dashboard
            </button>
          </section>
        ) : !activeRoom ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a room
          </div>
        ) : (
          <section className="flex-1 flex flex-col bg-gray-950 relative">
            {/* CHAT HEADER */}
            <div
              style={{
                height: "30px",
                backgroundColor: "#111",
                display: "flex",
                alignItems: "center",
                paddingLeft: "16px",
                paddingRight: "4px",
                borderBottom: "1px solid #444",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "16px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeRoom}
                {guestOnline && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontSize: "12px",
                      color: "rgba(80, 200, 120, 0.9)",
                    }}
                  >
                    ● Guest online
                  </span>
                )}
              </span>

              <div
                style={{
                  marginLeft: "auto",          // ⬅️ keep it pinned right
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",        // ✅ KEY FIX
                  gap: "10px",
                  height: "100%",
                }}
              >
                {/* EXPIRY COUNTDOWN */}
                {activeRoomData?.expiresAt && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.6)",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                      display: "flex",          // ✅ align baseline
                      alignItems: "center",
                      height: "100%",
                      lineHeight: "1",
                    }}
                  >
                    ⏳ {formatSeconds(remainingSeconds)}
                  </span>
                )}

                {/* CLOSE CHAT */}
                <button
                  onClick={() => {
                    setActiveRoom(null);
                    setMessages([]);
                  }}
                  style={{
                    height: "24px",
                    width: "35px",              // ✅ fixed size
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.14)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.18)",
                    cursor: "pointer",
                    display: "flex",            // ✅ perfect centering
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: "1",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CHAT BODY */}
            <div
              id="msg-box"
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            >
              {messages.map((m, i) => (
                <div key={i} className="flex w-full items-center">
                  <span className="flex-1">
                    {m.role === "guest" ? "👤 Guest" : "🐍 Mython"}: {m.text}
                  </span>
                  <span className="ml-4 text-sm text-gray-500 whitespace-nowrap">
                    {m.time}
                  </span>
                </div>
              ))}
            </div>

            {/* CHAT INPUT */}
            <div className="border-t border-gray-700 flex items-center px-6 py-3 gap-4 bg-gray-800">
              <input
                id="msg-input"
                placeholder="Type a message…"
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
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
                onClick={sendMsg}
                style={{
                  height: "28px",
                  padding: "0 14px",
                  fontSize: "14px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.14)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                }}
              >
                Send
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

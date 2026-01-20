import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { guestSetup, guestVerify } from "../api";
import axios from "axios";
import loginBg from "../assets/login-bg.png";

export default function Join() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  let roomId = params.get("room");
  let joinKey = params.get("key");
  if (roomId?.startsWith("<") && roomId?.endsWith(">")) {
    roomId = roomId.slice(1, -1);
  }

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const nameRef = useRef(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // 🔍 Fetch room info (single source of truth)
  useEffect(() => {
    if (!roomId) return;
    const backend = import.meta.env.VITE_BACKEND_HTTP;
    axios
      .get(`${backend}/rooms/${roomId}`)
      .then((res) => {
        if (!res.data?.exists) {
          setError("Invalid or expired room.");
          return;
        }
        setName("");
      })
      .catch(() => {
        setError("Invalid or expired room.");
      });
  }, [roomId]);

  async function handleJoin() {
    setError("");

    if (!name.trim() || !pin.trim()) {
      setError("Please enter username and PIN");
      return;
    }

    // 1️⃣ Try first-time setup
    try {
      await guestSetup(roomId, name, pin, joinKey);

      sessionStorage.setItem("guestName", name);
      sessionStorage.setItem("guestPin", pin);
      sessionStorage.setItem("guestAuthOK", "1");

      setLeaving(true);
      setTimeout(() => {
        navigate(`/chat?room=${roomId}`);
      }, 400);

      return;
    } catch (e) {
      // continue to verify
    }

    // 2️⃣ Try returning guest verify
    try {
      await guestVerify(roomId, name, pin, joinKey);

      sessionStorage.setItem("guestName", name);
      sessionStorage.setItem("guestPin", pin);
      sessionStorage.setItem("guestAuthOK", "1");

      setLeaving(true);
      setTimeout(() => {
        navigate(`/chat?room=${roomId}`);
      }, 250);

      return;
    } catch (e) {
      // both failed
    }

    // 3️⃣ Hard stop — chat must NOT open
    localStorage.removeItem("guestAuthOK");
    setError("Wrong username or PIN");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      <div
        style={{
          width: "360px",
          padding: "32px",
          borderRadius: "12px",
          backgroundColor: "rgba(20, 20, 20, 0.32)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
          opacity: leaving ? 0 : 1,
          transition: "opacity 400ms ease-in-out",
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "24px",
          }}
        >
          Mython Nova
        </h1>
        <p
          style={{
            fontSize: "13px",
            opacity: 0.6,
            textAlign: "center",
            marginBottom: "18px",
            letterSpacing: "0.3px",
          }}
        >
          You’re joining a private conversation
        </p>

        <input
          ref={nameRef}
          placeholder="Your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleJoin();
            }
          }}
          style={{
            width: "100%",
            height: "44px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: "rgba(120, 200, 220, 0.10)",
            color: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(255,255,255,0.25)",
            transition: "all 0.15s ease",
          }}
        />
        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleJoin();
            }
          }}
          style={{
            width: "100%",
            height: "44px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: "rgba(120, 200, 220, 0.10)",
            color: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(255,255,255,0.25)",
            transition: "all 0.15s ease",
            opacity: 0.85
          }}
        />

        {/* ERROR */}
        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: "14px",
              marginBottom: "12px",
            }}
          >
            {error}
          </p>
        )}

        {/* JOIN BUTTON */}
        <button
          onClick={handleJoin}
          style={{
            width: "100%",
            height: "44px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "10px",
            backgroundColor: "rgba(120, 200, 220, 0.18)",
            color: "rgba(255, 255, 255, 0.40)",
            border: "1px solid rgba(120, 200, 220, 0.35)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            backdropFilter: "blur(6px)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "rgba(120, 200, 220, 0.28)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "rgba(120, 200, 220, 0.18)")
          }
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "translateY(1px)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

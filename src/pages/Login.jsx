import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import loginBg from "../assets/login-bg.png";

export default function Login() {
  const backend = import.meta.env.VITE_BACKEND_HTTP;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("☝️S");

  const [allowReset, setAllowReset] = useState(false);
  const [newPin, setNewPin] = useState("");
  useEffect(() => {
    if (!showRecovery || allowReset) return;
    if (recoveryCode.length < 3) return;

    axios
      .post(`${backend}/auth/recovery/verify`, {
        code: recoveryCode,
      })
      .then(() => {
        setAllowReset(true);
      })
      .catch(() => {
        // intentionally silent
      });
  }, [recoveryCode, showRecovery, allowReset]);

  const navigate = useNavigate();
  const handleLogin = async () => {
    setError("");
    if (!pin.trim()) return setError("Enter PIN");

    try {
      const res = await axios.post(`${backend}/auth/login?pin=${pin}`);
      const token = res.data.token;

      if (!token) {
        setError("Invalid PIN");
        return;
      }

      sessionStorage.setItem("token", token);

      setLeaving(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 400);

    } catch {
        setAttempts(prev => {
          const next = prev + 1;
          if (next >= 3) {
            setLocked(true);
          }
          return next;
        });
        setError("Invalid PIN");
      }
  };
  const pinRef = useRef(null);
  useEffect(() => {
    pinRef.current?.focus();
  }, []);
  if (locked) {
    return (
      <div
        onClick={() => {
          if (showRecovery) return;
          setClickCount(c => {
            const next = c + 1;
            if (next >= 10) {
              setShowRecovery(true);
            }
            return next;
          });
        }}
        style={{
          height: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
      >
        <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
          You are locked out
        </h2>

        {showRecovery && !allowReset && (
          <input
            placeholder="☝️S"
            value={recoveryCode === "☝️S" ? "" : recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            style={{
              background: "black",
              color: "white",
              border: "1px solid #555",
              padding: "10px",
              fontSize: "16px",
              outline: "none",
            }}
          />
        )}

        {allowReset && (
          <>
            <input
              placeholder="NEW PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              style={{
                background: "black",
                color: "white",
                border: "1px solid #555",
                padding: "10px",
                fontSize: "16px",
                outline: "none",
              }}
            />
            <button
              onClick={async () => {
                await axios.post(`${backend}/auth/recovery/reset`, {
                  newPin,
                });
                window.location.reload();
              }}
              style={{
                marginTop: "12px",
                background: "black",
                color: "white",
                border: "1px solid white",
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              Set new PIN
            </button>
          </>
        )}
      </div>
    );
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
        color: "rgba(255, 255, 255, 0.3)",

        // 🔽 makes image visible again
        filter: "brightness(1.05) contrast(1.05)",
      }}
    >
      <div
        style={{
          width: "360px",
          padding: "32px",
          borderRadius: "12px",
          backgroundColor: "rgba(20, 20, 20, 0.25)", // 👈 transparency
          boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)", // optional (nice)
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

        {/* PIN INPUT */}
        <input
          ref={pinRef}
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
          style={{
            width: "100%",
            height: "44px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "8px",
            backgroundColor: "rgba(120, 200, 220, 0.10)", // 👈 translucent
            color: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            marginBottom: "10px",
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

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            height: "44px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "10px",

            // cool blue glass
            backgroundColor: "rgba(120, 200, 220, 0.18)",

            // soft white text
            color: "rgba(255, 255, 255, 0.40)",

            // icy border
            border: "1px solid rgba(120, 200, 220, 0.35)",

            cursor: "pointer",
            transition: "all 0.2s ease",
            backdropFilter: "blur(6px)",
          }}

          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(120, 200, 220, 0.28)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(120, 200, 220, 0.18)")
          }
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "translateY(1px)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          Login
        </button>
      </div>
    </div>
  );
}

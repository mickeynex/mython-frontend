import { useState } from "react";
import axios from "axios";

export default function ChangePin({ onClose }) {
  const backend = import.meta.env.VITE_BACKEND_HTTP;

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const FIELD_WIDTH = "220px";

  const handleChange = async () => {
    setError("");
    setSuccess("");

    if (!currentPin || !newPin) {
      setError("Both fields required");
      return;
    }

    try {
      await axios.post(`${backend}/auth/change-pin`, {
        currentPin,
        newPin,
      });
      setSuccess("PIN updated successfully");
      setCurrentPin("");
      setNewPin("");
    } catch {
      setError("Invalid current PIN");
    }
  };

  return (
    <div
        style={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        paddingLeft: "12px",
        }}
    >
        {/* CURRENT PIN */}
        <input
        type="password"
        placeholder="Current PIN"
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value)}
        style={{
            width: "220px",
            height: "40px",
            padding: "0 14px",
            borderRadius: "10px",
            backgroundColor: "#222",
            color: "white",
            border: "1px solid rgba(255,255,255,0.25)",
            outline: "none",
            fontSize: "15px",
        }}
        />

        {/* NEW PIN */}
        <input
        type="password"
        placeholder="New PIN"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
        style={{
            width: "220px",
            height: "40px",
            padding: "0 14px",
            borderRadius: "10px",
            backgroundColor: "#222",
            color: "white",
            border: "1px solid rgba(255,255,255,0.25)",
            outline: "none",
            fontSize: "15px",
        }}
        />

        {/* ERROR / SUCCESS */}
        {error && (
        <div style={{ width: "220px", color: "#f87171", fontSize: "13px" }}>
            {error}
        </div>
        )}
        {success && (
        <div style={{ width: "220px", color: "#4ade80", fontSize: "13px" }}>
            {success}
        </div>
        )}

        {/* CHANGE PIN BUTTON */}
        <button
        onClick={handleChange}
        style={{
            width: "220px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(120, 200, 220, 0.18)",
            border: "1px solid rgba(120, 200, 220, 0.35)",
            color: "white",
            cursor: "pointer",
            fontSize: "15px",
            transition: "all 0.18s ease",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background =
            "rgba(120, 200, 220, 0.28)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background =
            "rgba(120, 200, 220, 0.18)";
        }}
        onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(1px)";
        }}
        onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
        }}
        >
        Change PIN
        </button>
    </div>
    );
}

import axios from "axios";
baseURL: import.meta.env.VITE_BACKEND_HTTP

/**
 * Backend HTTP client
 * Single source of truth for API base URL
 */
export const backend = axios.create({
  baseURL: "http://localhost:8000", // LOCAL BACKEND DURING DEV
  withCredentials: false,
});

// ---------------- Guest APIs ----------------

export async function guestSetup(roomId, name, pin, key) {
  const res = await backend.post("/rooms/guest/setup", {
    room_id: roomId,
    name,
    pin,
    key,
  });
  return res.data;
}

export async function guestVerify(roomId, name, pin, key) {
  const res = await backend.post("/rooms/guest/verify", {
    room_id: roomId,
    name,
    pin,
    key,
  });
  return res.data;
}

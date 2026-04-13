import { io, Socket } from "socket.io-client";
import { getAuth } from "./auth";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("/", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Auto-join the personal room so backend can target this user.
    // Emits on every connect/reconnect so the room membership is always fresh.
    socket.on("connect", () => {
      const auth = getAuth();
      if (auth) {
        socket!.emit("join", {
          user_id: Number(auth.user_id), // MUST be integer, not string
          role:    auth.role.toLowerCase(),
        });
      }
    });
  }

  // Also emit immediately if already connected (e.g. page navigated after login)
  const auth = getAuth();
  if (socket.connected && auth) {
    socket.emit("join", {
      user_id: Number(auth.user_id),
      role:    auth.role.toLowerCase(),
    });
  }

  return socket;
}

export function joinSocketRoom() {
  const auth = getAuth();
  if (!auth) return;
  const s = getSocket();
  s.emit("join", {
    user_id: Number(auth.user_id),
    role:    auth.role.toLowerCase(),
  });
}

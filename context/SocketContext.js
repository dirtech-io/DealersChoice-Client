import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "../api/config";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Clean the URL
    // Socket.io wants the BASE origin (e.g., http://192.168.1.5:5000)
    // without /api or trailing slashes.
    const socketUrl = API_BASE.replace(/\/api$/, "").replace(/\/$/, "");

    const newSocket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
      // If your server sits behind a path like /socket.io (default),
      // you usually don't need 'path', but if you use a custom path
      // in your server.js, add it here:
      // path: '/socket.io'
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      // This is where your "Invalid namespace" error was being caught
      console.error("Socket Connection Error:", error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

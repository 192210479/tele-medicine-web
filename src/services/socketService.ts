const API_BASE_URL = 'http://localhost:5000';

// Step 1: Persistent Socket Connection
// Ensure the frontend creates only one socket connection globally.
// Use window.io from the CDN script in index.html
const socket = (window as any).io ? (window as any).io(API_BASE_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000
}) : null;

export default socket;

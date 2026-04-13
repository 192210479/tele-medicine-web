import { Socket } from 'socket.io-client';
import { getSocket } from '../utils/socketUtils';

class ConsultationSocketService {
  private socket: Socket | null = null;
  private consultationId: string | null = null;

  connect() {
    if (this.socket) return this.socket;
    this.socket = getSocket();

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      if (this.consultationId) {
        this.joinRoom(this.consultationId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  joinRoom(consultationId: string) {
    this.consultationId = consultationId;
    if (this.socket?.connected) {
      this.socket.emit('join_consultation_room', { consultation_id: consultationId });
    }
  }

  leaveRoom(consultationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_consultation_room', { consultation_id: consultationId });
    }
    this.consultationId = null;
  }

  getSocket() {
    return this.socket || getSocket();
  }

  on(event: string, callback: (data: any) => void) {
    this.getSocket().on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.getSocket().off(event, callback);
  }

  emit(event: string, data: any) {
    const s = this.getSocket();
    if (s.connected) {
      s.emit(event, data);
    } else {
      console.warn('Socket not connected. Event queued or dropped:', event);
    }
  }

  disconnect() {
    // We don't disconnect the singleton here as it might be used elsewhere
    // this.socket?.disconnect();
    this.socket = null;
  }
}

const socketService = new ConsultationSocketService();
export default socketService;

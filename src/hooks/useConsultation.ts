import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "../utils/socketUtils";

export type ConsultationPhase =
  | "waiting" | "doctor_ready" | "waiting_patient_join"
  | "in_call" | "call_ended" | "prescription" | "rx_ready";

export interface ChatMessage {
  id: number; senderId: number; senderRole: string;
  message: string; time: string;
}

interface Options {
  appointmentId:   number;
  userId:          number;
  role:            "doctor" | "patient";
  consultationId?: number | null;
}

export const useConsultation = ({
  appointmentId, userId, role, consultationId,
}: Options) => {
  const [phase,            setPhase]           = useState<ConsultationPhase>("waiting");
  const [channel,          setChannel]         = useState<string | null>(null);
  const [token,            setToken]           = useState<string | null>(null);
  const [startTimeUtc,     setStartTimeUtc]    = useState<string | null>(null);
  const [callEndedBy,      setCallEndedBy]     = useState<string | null>(null);
  const [callEndReason,    setCallEndReason]   = useState<string | null>(null);
  const [messages,         setMessages]        = useState<ChatMessage[]>([]);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const [prescriptionId,   setPrescriptionId]  = useState<number | null>(null);
  const [patientWaiting,   setPatientWaiting]  = useState(false);
  const [uid,              setUid]             = useState<number | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!appointmentId || !userId) return;
    const socket = getSocket();

    const onJoined = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      if (d.role === role) {
        joinedRef.current = true;
        console.log(`[Consultation] ✅ ${role} registered in room`);
      }
    };
    const onPatientWaiting = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      setPatientWaiting(true);
    };
    const onConsultationReady = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      console.log("[Consultation] consultation_ready received");
      setChannel(d.channel_name);
      setToken(d.token);
      setPhase(role === "patient" ? "doctor_ready" : "waiting_patient_join");
    };
    const onStartCall = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      console.log("[Consultation] ✅ start_call received");
      setChannel(d.channel_name);
      setToken(d.token);
      if (d.uid) setUid(Number(d.uid));
      setStartTimeUtc(d.start_time_utc ?? new Date().toISOString());
      setPhase("in_call");
    };
    const onCallEnded = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      setCallEndedBy(d.ended_by);
      setCallEndReason(d.reason);
      setPhase("call_ended");
    };
    const onUserDisconnected = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      if (d.role !== role) setPeerDisconnected(true);
    };
    const onPrescriptionReady = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      setPrescriptionId(d.prescription_id);
      if (role === "patient") setPhase("rx_ready");
    };
    const onStateRestored = (d: any) => {
      if (Number(d.appointment_id) !== appointmentId) return;
      const s = d.consultation_status;
      if      (s === "Waiting")   setPhase("waiting");
      else if (s === "Ready")     setPhase(role === "patient" ? "doctor_ready" : "waiting_patient_join");
      else if (s === "Ongoing")   setPhase("in_call");
      else if (s === "Completed") setPhase("call_ended");
      if (d.channel_name) setChannel(d.channel_name);
      if (d.started_at)   setStartTimeUtc(d.started_at);
      if (d.uid)          setUid(Number(d.uid));
    };
    const onReceiveMessage = (d: any) => {
      setMessages(prev => [...prev, {
        id: d.id, senderId: d.sender_id,
        senderRole: d.sender_role,
        message: d.message, time: d.time,
      }]);
    };
    const onReconnect = () => {
      socket.emit("connect_user",       { user_id: userId, role });
      socket.emit("join_consultation",  { appointment_id: appointmentId, user_id: userId, role });
      socket.emit("join_room",          { room: `consultation_${appointmentId}` });
      socket.emit("rejoin_consultation",{ appointment_id: appointmentId, user_id: userId, role });
      if (role === "patient")
        socket.emit("patient_waiting",  { appointment_id: appointmentId, patient_id: userId });
    };

    const events = [
      "user_joined_consultation","patient_waiting","consultation_ready",
      "start_call","call_ended","user_disconnected","prescription_ready",
      "consultation_state_restored","receive_message",
    ];
    events.forEach(e => socket.removeAllListeners(e));
    socket.removeListener("reconnect", onReconnect);
    socket.removeListener("connect",   onReconnect);

    socket.on("user_joined_consultation",    onJoined);
    socket.on("patient_waiting",             onPatientWaiting);
    socket.on("consultation_ready",          onConsultationReady);
    socket.on("start_call",                  onStartCall);
    socket.on("call_ended",                  onCallEnded);
    socket.on("user_disconnected",           onUserDisconnected);
    socket.on("prescription_ready",          onPrescriptionReady);
    socket.on("consultation_state_restored", onStateRestored);
    socket.on("receive_message",             onReceiveMessage);
    socket.on("reconnect",                   onReconnect);
    socket.on("connect",                     onReconnect);

    socket.emit("connect_user",      { user_id: userId, role });
    socket.emit("join_consultation", { appointment_id: appointmentId, user_id: userId, role });
    socket.emit("join_room",         { room: `consultation_${appointmentId}` });
    if (role === "patient")
      socket.emit("patient_waiting", { appointment_id: appointmentId, patient_id: userId });

    const hb = setInterval(() => socket.emit("heartbeat", {}), 10000);

    return () => {
      clearInterval(hb);
      socket.off("user_joined_consultation",    onJoined);
      socket.off("patient_waiting",             onPatientWaiting);
      socket.off("consultation_ready",          onConsultationReady);
      socket.off("start_call",                  onStartCall);
      socket.off("call_ended",                  onCallEnded);
      socket.off("user_disconnected",           onUserDisconnected);
      socket.off("prescription_ready",          onPrescriptionReady);
      socket.off("consultation_state_restored", onStateRestored);
      socket.off("receive_message",             onReceiveMessage);
      socket.off("reconnect",                   onReconnect);
      socket.off("connect",                     onReconnect);
    };
  }, [appointmentId, userId, role]);

  // Doctor "Start Consultation" — waits for join ACK before emitting
  const emitDoctorReady = useCallback(() => {
    const socket = getSocket();
    const doEmit = () => {
      console.log("[Consultation] Emitting doctor_ready");
      socket.emit("doctor_ready", {
        appointment_id: appointmentId, doctor_id: userId,
      });
    };
    if (joinedRef.current) {
      doEmit();
    } else {
      const onAck = (d: any) => {
        if (Number(d.appointment_id) === appointmentId && d.role === "doctor") {
          joinedRef.current = true;
          socket.off("user_joined_consultation", onAck);
          doEmit();
        }
      };
      socket.on("user_joined_consultation", onAck);
      socket.emit("join_consultation", {
        appointment_id: appointmentId, user_id: userId, role: "doctor",
      });
    }
  }, [appointmentId, userId]);

  // Patient "Join Consultation" button
  const emitJoinCall = useCallback(() => {
    console.log("[Consultation] Patient emitting start_call");
    getSocket().emit("start_call", { appointment_id: appointmentId });
  }, [appointmentId]);

  const emitEndCall = useCallback(() => {
    getSocket().emit(
      role === "doctor" ? "doctor_end_call" : "patient_end_call",
      { appointment_id: appointmentId }
    );
  }, [appointmentId, role]);

  const emitToggleMic = useCallback((enabled: boolean) => {
    getSocket().emit("toggle_mic",
      { appointment_id: appointmentId, user_id: userId, role, enabled });
  }, [appointmentId, userId, role]);

  const emitToggleCamera = useCallback((enabled: boolean) => {
    getSocket().emit("toggle_camera",
      { appointment_id: appointmentId, user_id: userId, role, enabled });
  }, [appointmentId, userId, role]);

  const sendMessage = useCallback((text: string) => {
    getSocket().emit("send_message", {
      room:            `consultation_${appointmentId}`,
      consultation_id: consultationId,
      sender_id:       userId,
      sender_role:     role,
      message:         text,
    });
  }, [appointmentId, consultationId, userId, role]);

  const emitPrescriptionSubmitted = useCallback((rxId: number) => {
    getSocket().emit("prescription_submitted", {
      appointment_id: appointmentId, prescription_id: rxId,
    });
  }, [appointmentId]);

  return {
    phase, setPhase, channel, token, uid, startTimeUtc,
    callEndedBy, callEndReason, messages,
    peerDisconnected, prescriptionId, patientWaiting,
    emitDoctorReady, emitJoinCall, emitEndCall,
    emitToggleMic, emitToggleCamera,
    sendMessage, emitPrescriptionSubmitted,
  };
};

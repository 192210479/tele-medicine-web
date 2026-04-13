import AgoraRTC, {
  IAgoraRTCClient, ICameraVideoTrack,
  IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import { useCallback, useRef, useState } from "react";

const APP_ID = (import.meta.env.VITE_AGORA_APP_ID as string) ?? "";

export const useAgoraClient = () => {
  const clientRef      = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef  = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef  = useRef<ICameraVideoTrack | null>(null);
  const remoteVideoRef = useRef<IRemoteVideoTrack | null>(null);
  const remoteAudioRef = useRef<IRemoteAudioTrack | null>(null);
  const localElRef     = useRef<HTMLDivElement | null>(null);
  const remoteElRef    = useRef<HTMLDivElement | null>(null);
  const joinedRef      = useRef(false);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [joined,     setJoined]     = useState(false);

  // Ref callbacks — pass to <div ref={agora.setLocalEl} />
  // Re-plays track automatically when React remounts the container
  const setLocalEl = useCallback((el: HTMLDivElement | null) => {
    localElRef.current = el;
    if (el && localVideoRef.current) {
      el.innerHTML = "";
      localVideoRef.current.play(el);
    }
  }, []);

  const setRemoteEl = useCallback((el: HTMLDivElement | null) => {
    remoteElRef.current = el;
    if (el && remoteVideoRef.current) {
      el.innerHTML = "";
      remoteVideoRef.current.play(el);
    }
  }, []);

  const joinChannel = useCallback(async (
    channel: string, token: string, uid: number,
  ) => {
    if (joinedRef.current || clientRef.current) {
      console.warn("[Agora] Already joined"); return;
    }
    if (!APP_ID) {
      alert("VITE_AGORA_APP_ID missing. Add to .env → restart npm run dev");
      return;
    }
    console.log("[Agora] App ID:", APP_ID);
    console.log("[Agora] Channel:", channel, "| UID:", uid);

    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      console.log("[Agora] ✅ Permissions granted");
    } catch (err: any) {
      console.error("[Agora] Permission:", err.name);
      if (err.name === "NotAllowedError")
        alert("Camera/mic denied. Allow in browser address bar → refresh.");
      else if (err.name === "NotFoundError")
        alert("No camera/mic found. Connect device → refresh.");
      return;
    }

    try {
      AgoraRTC.setLogLevel(1);
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && user.videoTrack) {
          remoteVideoRef.current = user.videoTrack;
          const play = () => {
            if (remoteElRef.current) {
              remoteElRef.current.innerHTML = "";
              user.videoTrack!.play(remoteElRef.current);
              console.log("[Agora] ✅ Remote video playing");
            } else setTimeout(play, 150);
          };
          play();
        }
        if (mediaType === "audio" && user.audioTrack) {
          remoteAudioRef.current = user.audioTrack;
          user.audioTrack.play();
          console.log("[Agora] ✅ Remote audio playing");
        }
      });
      client.on("user-unpublished", (_, mt) => {
        if (mt === "video" && remoteElRef.current) {
          remoteElRef.current.innerHTML = "";
          remoteVideoRef.current = null;
        }
      });
      client.on("user-left", () => {
        if (remoteElRef.current) remoteElRef.current.innerHTML = "";
        remoteVideoRef.current = null; remoteAudioRef.current = null;
      });

      await client.join(APP_ID, channel, token || null, uid);
      console.log("[Agora] ✅ Joined channel");

      const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { AEC: true, ANS: true, AGC: true },
        { encoderConfig: "480p_1" }
      );
      localAudioRef.current = audio;
      localVideoRef.current = video;
      await client.publish([audio, video]);
      console.log("[Agora] ✅ Published");

      const playLocal = () => {
        if (localElRef.current) {
          localElRef.current.innerHTML = "";
          video.play(localElRef.current);
          console.log("[Agora] ✅ Local video playing");
        } else setTimeout(playLocal, 150);
      };
      playLocal();

      joinedRef.current = true;
      setJoined(true); setMicEnabled(true); setCamEnabled(true);

    } catch (err: any) {
      console.error("[Agora] Join error:", err.message ?? err);
      clientRef.current = null; joinedRef.current = false;
    }
  }, []);

  const toggleMic = useCallback(async (enabled: boolean) => {
    await localAudioRef.current?.setEnabled(enabled);
    setMicEnabled(enabled);
  }, []);

  const toggleCamera = useCallback(async (enabled: boolean) => {
    await localVideoRef.current?.setEnabled(enabled);
    setCamEnabled(enabled);
    if (enabled && localElRef.current && localVideoRef.current) {
      localElRef.current.innerHTML = "";
      localVideoRef.current.play(localElRef.current);
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    try {
      localAudioRef.current?.stop(); localAudioRef.current?.close();
      localVideoRef.current?.stop(); localVideoRef.current?.close();
      await clientRef.current?.leave();
      console.log("[Agora] ✅ Left channel");
    } catch(e) { console.error("[Agora] Leave:", e); }
    clientRef.current = null; localAudioRef.current = null;
    localVideoRef.current = null; remoteVideoRef.current = null;
    remoteAudioRef.current = null; joinedRef.current = false;
    if (localElRef.current)  localElRef.current.innerHTML  = "";
    if (remoteElRef.current) remoteElRef.current.innerHTML = "";
    setJoined(false); setMicEnabled(true); setCamEnabled(true);
  }, []);

  return {
    joinChannel, toggleMic, toggleCamera, leaveChannel,
    setLocalEl, setRemoteEl,
    joined, micEnabled, camEnabled,
  };
};

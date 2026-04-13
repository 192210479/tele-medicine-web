import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

class AgoraRTCService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;

  async initClient(appId: string) {
    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    return this.client;
  }

  async joinChannel(appId: string, channel: string, token: string, uid: string | number | null) {
    if (!this.client) await this.initClient(appId);
    
    // Join channel
    await this.client!.join(appId, channel, token, uid);
    
    // Create local tracks
    if (!this.localAudioTrack || !this.localVideoTrack) {
       this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
       this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    }

    // Publish local tracks
    await this.client!.publish([this.localAudioTrack, this.localVideoTrack]);
    
    return {
      localAudioTrack: this.localAudioTrack,
      localVideoTrack: this.localVideoTrack,
    };
  }

  async leaveChannel() {
    this.localAudioTrack?.stop();
    this.localAudioTrack?.close();
    this.localVideoTrack?.stop();
    this.localVideoTrack?.close();
    
    await this.client?.leave();
    
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.client = null;
  }

  async toggleMic(active: boolean) {
    await this.localAudioTrack?.setEnabled(active);
  }

  async toggleCamera(active: boolean) {
    await this.localVideoTrack?.setEnabled(active);
  }

  onUserPublished(callback: (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => void) {
    this.client?.on("user-published", callback);
  }

  onUserUnpublished(callback: (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => void) {
    this.client?.on("user-unpublished", callback);
  }

  getClient() {
    return this.client;
  }
}

const agoraService = new AgoraRTCService();
export default agoraService;

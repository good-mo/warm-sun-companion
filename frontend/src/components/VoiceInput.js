/**
 * 语音输入组件
 * 封装浏览器麦克风录音，用于 ASR 语音识别
 */
export class VoiceInput {
  constructor() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
    this.isRecording = false;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(null);
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.stream.getTracks().forEach((t) => t.stop());
        this.isRecording = false;
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }
}

export default VoiceInput;

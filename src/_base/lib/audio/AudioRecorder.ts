/**
 * AudioRecorder - Captura e processamento de áudio do microfone.
 */

export interface AudioRecorderState {
  recording: boolean;
  levels: number[];
  samples: Float32Array | null;
  sampleRate: number;
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private buffers: Float32Array[] = [];
  private recording = false;
  private onUpdate: (rms: number, data: Uint8Array) => void;

  constructor(onUpdate: (rms: number, data: Uint8Array) => void) {
    this.onUpdate = onUpdate;
  }

  async startListening(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Analyser for real-time levels
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      if (!this.stream) return;
      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      this.onUpdate(rms, dataArray);

      if (this.stream) requestAnimationFrame(updateLevels);
    };
    requestAnimationFrame(updateLevels);

    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (this.recording) {
        const input = e.inputBuffer.getChannelData(0);
        this.buffers.push(new Float32Array(input));
      }
    };

    this.source.connect(analyser);
    analyser.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  startRecording(): void {
    this.buffers = [];
    this.recording = true;
  }

  stopRecording(): { samples: Float32Array; sampleRate: number } {
    this.recording = false;
    const totalLength = this.buffers.reduce((acc, b) => acc + b.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const b of this.buffers) {
      result.set(b, offset);
      offset += b.length;
    }
    return {
      samples: result,
      sampleRate: this.audioContext?.sampleRate || 44100,
    };
  }

  stopListening(): void {
    this.recording = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  static encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const floatTo16BitPCM = (offset: number, input: Float32Array) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(44, samples);

    return new Blob([view], { type: 'audio/wav' });
  }
}

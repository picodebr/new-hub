let globalStream: MediaStream | null = null;
let globalVideo: HTMLVideoElement | null = null;

export async function getGlobalWebcam() {
  if (typeof window === "undefined") return null;

  if (!globalVideo) {
    globalVideo = document.createElement("video");
    globalVideo.autoplay = true;
    globalVideo.muted = true;
    globalVideo.playsInline = true;
    globalVideo.width = 224;
    globalVideo.height = 224;
  }

  if (globalStream) return globalVideo;

  try {
    globalStream = await navigator.mediaDevices.getUserMedia({ video: true });
    globalVideo.srcObject = globalStream;

    return new Promise<HTMLVideoElement>((resolve) => {
      if (!globalVideo) return;
      globalVideo.onloadedmetadata = () => {
        resolve(globalVideo!);
      };
    });
  } catch (err) {
    console.error("Camera access denied", err);
    throw err;
  }
}

export function getGlobalWebcamStream() {
  return globalStream;
}

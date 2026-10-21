/**
 * AudioEffects - Porta fiel dos efeitos de áudio do Scratch 3.0.
 *
 * Aplica efeitos offline usando OfflineAudioContext, retornando
 * um novo AudioBuffer com o resultado processado.
 *
 * Suporta aplicação em uma região selecionada (start/end em frações 0–1).
 *
 * Referência: scratch-gui/src/lib/audio/audio-effects.js
 */

export type EffectName = 'faster' | 'slower' | 'louder' | 'softer' | 'echo' | 'robot' | 'fadein' | 'fadeout' | 'mute' | 'reverse';

export interface EffectSelection {
  start: number; // 0–1
  end: number; // 0–1
}

/** Major third ratio (usado pelo Scratch para faster/slower) */
const PITCH_RATIO = Math.pow(2, 4 / 12);

/** Segundos de cauda adicionados pelo eco */
const ECHO_TAIL = 0.75;

function createDiodeNode(ctx: OfflineAudioContext): WaveShaperNode {
  const node = ctx.createWaveShaper();
  const vb = 0.2,
    vl = 0.4,
    h = 0.65;
  const bufLen = 1024;
  const curve = new Float32Array(bufLen);
  for (let i = 0; i < bufLen; i++) {
    const v = (2 * i) / bufLen - 1;
    if (v <= vb) curve[i] = 0;
    else if (v <= vl) curve[i] = h * (Math.pow(v - vb, 2) / (2 * vl - 2 * vb));
    else curve[i] = h * v - h * vl + h * (Math.pow(v - vb, 2) / (2 * vl - 2 * vb));
  }
  node.curve = curve;
  return node;
}

/** Aplica um efeito ao buffer inteiro usando OfflineAudioContext. */
async function applyEffectToWholeBuffer(buffer: AudioBuffer, effect: EffectName): Promise<AudioBuffer> {
  const sr = buffer.sampleRate;
  const duration = buffer.duration;

  // ── Reverse: manipulação direta dos dados ───────────────────────────
  if (effect === 'reverse') {
    const channels = buffer.numberOfChannels;
    const out = new AudioBuffer({ numberOfChannels: channels, length: buffer.length, sampleRate: sr });
    for (let c = 0; c < channels; c++) {
      const src = buffer.getChannelData(c);
      const dst = out.getChannelData(c);
      for (let i = 0; i < src.length; i++) dst[i] = src[src.length - 1 - i];
    }
    return out;
  }

  // ── Tamanho do buffer de saída ───────────────────────────────────────
  let outputSamples = buffer.length;
  let playbackRate = 1;

  if (effect === 'faster') {
    playbackRate = PITCH_RATIO;
    outputSamples = Math.floor(buffer.length / PITCH_RATIO);
  } else if (effect === 'slower') {
    playbackRate = 1 / PITCH_RATIO;
    outputSamples = Math.floor(buffer.length * PITCH_RATIO);
  } else if (effect === 'echo') {
    outputSamples = Math.max(buffer.length, Math.floor((duration + ECHO_TAIL) * sr));
  }

  const ctx = new OfflineAudioContext(1, outputSamples, sr);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  switch (effect) {
    case 'faster':
    case 'slower': {
      source.playbackRate.value = playbackRate;
      source.connect(ctx.destination);
      break;
    }

    case 'louder':
    case 'softer': {
      const volume = effect === 'louder' ? 1.25 : 0.75;
      const gain = ctx.createGain();
      const ramp = 0.01;
      gain.gain.setValueAtTime(1.0, Math.max(0, 0 - ramp));
      gain.gain.exponentialRampToValueAtTime(volume, 0.001);
      gain.gain.setValueAtTime(volume, duration);
      gain.gain.exponentialRampToValueAtTime(1.0, duration + ramp);
      source.connect(gain);
      gain.connect(ctx.destination);
      break;
    }

    case 'mute': {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, 0);
      gain.gain.linearRampToValueAtTime(0.001, 0.001);
      gain.gain.setValueAtTime(0.001, duration);
      source.connect(gain);
      gain.connect(ctx.destination);
      break;
    }

    case 'fadein': {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(1, duration);
      source.connect(gain);
      gain.connect(ctx.destination);
      break;
    }

    case 'fadeout': {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, 0);
      gain.gain.linearRampToValueAtTime(0, duration);
      source.connect(gain);
      gain.connect(ctx.destination);
      break;
    }

    case 'echo': {
      const inputGain = ctx.createGain();
      const outputGain = ctx.createGain();
      const effectInput = ctx.createGain();
      effectInput.gain.value = 0;
      effectInput.gain.setValueAtTime(0.75, 0);
      effectInput.gain.setValueAtTime(0, duration);

      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.25;

      const decay = ctx.createGain();
      decay.gain.value = 0.3;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -5;
      compressor.knee.value = 15;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      source.connect(inputGain);
      inputGain.connect(effectInput);
      effectInput.connect(delay);
      delay.connect(compressor);
      inputGain.connect(compressor);
      delay.connect(decay);
      decay.connect(delay);
      compressor.connect(outputGain);
      outputGain.connect(ctx.destination);
      break;
    }

    case 'robot': {
      const inputGain = ctx.createGain();
      const outputGain = ctx.createGain();
      const passthrough = ctx.createGain();
      const effectInput = ctx.createGain();

      passthrough.gain.value = 0;
      effectInput.gain.value = 1;

      const osc = ctx.createOscillator();
      osc.frequency.value = 50;
      osc.start(0);

      const vInGain = ctx.createGain();
      vInGain.gain.value = 0.5;
      const vInInv1 = ctx.createGain();
      vInInv1.gain.value = -1;
      const vInInv2 = ctx.createGain();
      vInInv2.gain.value = -1;
      const vInInv3 = ctx.createGain();
      vInInv3.gain.value = -1;
      const vcInv1 = ctx.createGain();
      vcInv1.gain.value = -1;

      const vInDiode1 = createDiodeNode(ctx);
      const vInDiode2 = createDiodeNode(ctx);
      const vcDiode3 = createDiodeNode(ctx);
      const vcDiode4 = createDiodeNode(ctx);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -5;
      compressor.knee.value = 15;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 1000;
      hpFilter.gain.value = 1.25;

      source.connect(inputGain);
      inputGain.connect(effectInput);
      inputGain.connect(passthrough);
      passthrough.connect(outputGain);

      effectInput.connect(vcInv1);
      effectInput.connect(vcDiode4);
      vcInv1.connect(vcDiode3);

      osc.connect(vInGain);
      vInGain.connect(vInInv1);
      vInGain.connect(vcInv1);
      vInGain.connect(vcDiode4);

      vInInv1.connect(vInInv2);
      vInInv1.connect(vInDiode2);
      vInInv2.connect(vInDiode1);
      vInDiode1.connect(vInInv3);
      vInDiode2.connect(vInInv3);
      vInInv3.connect(compressor);
      vcDiode3.connect(compressor);
      vcDiode4.connect(compressor);

      effectInput.connect(hpFilter);
      hpFilter.connect(compressor);
      compressor.connect(outputGain);
      outputGain.connect(ctx.destination);
      break;
    }

    default:
      source.connect(ctx.destination);
  }

  source.start(0);
  return ctx.startRendering();
}

/**
 * Aplica um efeito de áudio a um AudioBuffer.
 *
 * Se `selection` for fornecido (frações 0–1), o efeito é aplicado apenas
 * à região selecionada. O áudio fora da seleção permanece intacto.
 * Se não houver seleção, aplica ao buffer inteiro.
 */
export async function applyEffect(buffer: AudioBuffer, effect: EffectName, selection?: EffectSelection | null): Promise<AudioBuffer> {
  const sr = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const hasSelection = selection != null && selection.end - selection.start > 0.002;

  if (!hasSelection) {
    return applyEffectToWholeBuffer(buffer, effect);
  }

  const startSample = Math.round(selection!.start * buffer.length);
  const endSample = Math.round(selection!.end * buffer.length);

  // Extrai dados de todos os canais
  const fullData = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c).slice());

  // Cria AudioBuffer só com a seleção
  const selLen = endSample - startSample;
  const selBuf = new AudioBuffer({ numberOfChannels: channels, length: selLen, sampleRate: sr });
  for (let c = 0; c < channels; c++) {
    selBuf.getChannelData(c).set(fullData[c].subarray(startSample, endSample));
  }

  // Aplica o efeito à seleção
  const processed = await applyEffectToWholeBuffer(selBuf, effect);
  const procLen = processed.length;

  // Concatena: [antes] + [seleção processada] + [depois]
  const totalLen = startSample + procLen + (buffer.length - endSample);
  const result = new AudioBuffer({ numberOfChannels: channels, length: totalLen, sampleRate: sr });
  for (let c = 0; c < channels; c++) {
    const dst = result.getChannelData(c);
    dst.set(fullData[c].subarray(0, startSample), 0);
    dst.set(processed.getChannelData(c), startSample);
    dst.set(fullData[c].subarray(endSample), startSample + procLen);
  }

  return result;
}

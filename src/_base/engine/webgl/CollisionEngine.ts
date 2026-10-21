import { WebGLRenderer } from './WebGLRenderer';
import { SpriteData } from '@/_base/domain/entities';

// Passo de amostragem em pixels do palco (granularidade da colisão)
const SAMPLE_STEP = 1;

interface AlphaMask {
  data: Uint8Array; // canal alpha da imagem original (1 byte por pixel)
  w: number; // largura original da imagem
  h: number; // altura original da imagem
  contentX: number; // x inicial do conteúdo real
  contentY: number; // y inicial do conteúdo real
  contentW: number; // largura do conteúdo real
  contentH: number; // altura do conteúdo real
}

export class CollisionEngine {
  private renderer: WebGLRenderer;

  // Alpha mask por costume URL — construída uma vez, reutilizada para sempre.
  private maskCache = new Map<string, AlphaMask | 'loading'>();

  // Cache de colisão sprite-vs-sprite: limpo uma vez por frame via RAF.
  private touchCache = new Map<string, boolean>();
  private currentFrameId = 0;
  private lastCacheFrameId = -1;

  // Canvas auxiliar apenas para extrair pixels na construção da máscara.
  private buildCanvas: HTMLCanvasElement;
  private buildCtx: CanvasRenderingContext2D;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    this.buildCanvas = document.createElement('canvas');
    this.buildCtx = this.buildCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  /** Chamado uma vez por frame pelo render loop do StageArea, sincronizado com drawSceneSync. */
  public tickFrame(): void {
    this.currentFrameId++;
  }

  /** Limpa o cache de colisão manualmente (útil após mudar fantasia ou posição no mesmo frame). */
  public clearCache(): void {
    this.touchCache.clear();
  }

  // ─── Construção de máscara (uma vez por URL) ─────────────────────────────

  private ensureMask(url: string): void {
    if (!url || this.maskCache.has(url)) return;
    this.maskCache.set(url, 'loading');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      // Robustez para SVGs: Se o navegador usar o tamanho padrão (ex: 300x150) por falta de width/height,
      // tentamos inferir o tamanho real se for um SVG que exportamos ou conhecemos.
      // No PiCode, o artboard padrão é 480x360.
      if ((url.includes('.svg') || url.startsWith('data:image/svg+xml')) && (w === 300 || w === 0)) {
         // Fallback conservador: se detectamos o comportamento de "tamanho padrão" do navegador,
         // e é um SVG, assumimos o 480x360 do palco para evitar o "shrink" do hit-test.
         w = 480;
         h = 360;
      }

      this.buildCanvas.width = w;
      this.buildCanvas.height = h;
      this.buildCtx.clearRect(0, 0, w, h);
      this.buildCtx.drawImage(img, 0, 0, w, h);
      const raw = this.buildCtx.getImageData(0, 0, w, h).data;
      // Extrai só o canal alpha para economizar memória e calcula bounds reais
      const alpha = new Uint8Array(w * h);
      let minX = w, minY = h, maxX = 0, maxY = 0;
      let hasPixels = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = raw[(y * w + x) * 4 + 3];
          alpha[y * w + x] = a;
          if (a > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasPixels = true;
          }
        }
      }

      if (!hasPixels) {
        minX = 0; minY = 0; maxX = w; maxY = h;
      }

      this.maskCache.set(url, { 
        data: alpha, 
        w, h,
        contentX: minX,
        contentY: minY,
        contentW: maxX - minX + 1,
        contentH: maxY - minY + 1
      });
    };
    img.onerror = () => this.maskCache.delete(url);
    img.src = url;
  }

  // ─── Lookup de alpha com transform inverso ────────────────────────────────

  /**
   * Retorna o alpha (0-255) do sprite em um ponto do palco (sx, sy).
   * Aplica rotação e escala inversas para mapear ao pixel correto da imagem.
   */
  private sampleAlpha(
    sprite: SpriteData,
    mask: AlphaMask,
    sx: number,
    sy: number,
    cosRot: number,
    sinRot: number, // pré-computados fora do loop
  ): number {
    // Offset relativo ao centro do sprite (coordenadas do palco, Y para cima)
    const dx = sx - sprite.x;
    const dy = sy - sprite.y;

    // Rotação inversa
    const rx = cosRot * dx + sinRot * dy;
    const ry = -sinRot * dx + cosRot * dy;

    // Escala inversa
    const scale = (sprite.size || 100) / 100;
    let lx = rx / scale;
    const ly = ry / scale; // ainda Y para cima

    // Flip horizontal para left-right quando virado para a esquerda (angle < 0).
    // O WebGLRenderer aplica scaleX *= -1 nesse caso; reproduzimos aqui.
    if (sprite.rotationStyle === 'left-right' && (sprite.angle || 0) < 0) {
      lx = -lx;
    }

    // Mapeia para pixel da imagem (origem topo-esquerdo, Y para baixo)
    const px = Math.floor(lx + mask.w / 2);
    const py = Math.floor(-ly + mask.h / 2);

    if (px < 0 || px >= mask.w || py < 0 || py >= mask.h) return 0;
    return mask.data[py * mask.w + px];
  }

  /** Calcula cos/sin da rotação inversa para um sprite (idêntico ao WebGLRenderer). */
  private getInverseRot(sprite: SpriteData): { cos: number; sin: number } {
    if (sprite.rotationStyle === "don't rotate") return { cos: 1, sin: 0 };

    // WebGL usa rotDeg = 90 - sprite.angle; inverso = -(90 - angle) = angle - 90
    const rotDeg = sprite.angle - 90;
    const rad = rotDeg * (Math.PI / 180);
    let c = Math.cos(rad);
    let s = Math.sin(rad);

    if (sprite.rotationStyle === 'left-right') {
      // Sem rotação; flip X quando angle < 0 (tratado no sampleAlpha via dx flip)
      c = 1;
      s = 0;
    }
    return { cos: c, sin: s };
  }

  // ─── Colisão sprite-vs-sprite (síncrono, sem GPU) ────────────────────────

  public isTouchingSprite(spriteA: SpriteData, candidates: SpriteData[]): boolean {
    // Invalida o cache a cada novo frame RAF.
    if (this.currentFrameId !== this.lastCacheFrameId) {
      this.touchCache.clear();
      this.lastCacheFrameId = this.currentFrameId;
    }

    // Carrega a máscara de A antes do AABB para usar as dimensões reais da imagem.
    // sprite.width/height podem ser undefined até o renderer renderizar o primeiro frame.
    if (spriteA.costume) this.ensureMask(spriteA.costume);
    const mA = spriteA.costume ? this.maskCache.get(spriteA.costume) : undefined;

    // Usa dimensões da máscara (reais) quando disponíveis; fallback para sprite.width ou 50px.
    const imgWA = (mA && mA !== 'loading') ? mA.w : (spriteA.width || 50);
    const imgHA = (mA && mA !== 'loading') ? mA.h : (spriteA.height || 50);
    const wA = imgWA * ((spriteA.size || 100) / 100);
    const hA = imgHA * ((spriteA.size || 100) / 100);

    for (const cand of candidates) {
      // Carrega a máscara do candidato antes do AABB pelo mesmo motivo.
      if (cand.costume) this.ensureMask(cand.costume);
      const mB = cand.costume ? this.maskCache.get(cand.costume) : undefined;

      const imgWB = (mB && mB !== 'loading') ? mB.w : (cand.width || 50);
      const imgHB = (mB && mB !== 'loading') ? mB.h : (cand.height || 50);
      const wB = imgWB * ((cand.size || 100) / 100);
      const hB = imgHB * ((cand.size || 100) / 100);

      // AABB: descarte rápido
      if (Math.abs(spriteA.x - cand.x) >= (wA + wB) / 2 || Math.abs(spriteA.y - cand.y) >= (hA + hB) / 2) continue;

      // Cache por frame: evita re-processar o pixel check para o mesmo par
      // em chamadas repetidas dentro do mesmo frame (loops PicoVM rápidos).
      const cacheKey = spriteA.id + '|' + cand.id;
      const cached = this.touchCache.get(cacheKey);
      if (cached !== undefined) {
        if (cached) return true;
        continue;
      }

      // Máscara ainda carregando → resultado conservador (assume colisão)
      if (!mA || mA === 'loading' || !mB || mB === 'loading') return true;

      // Pré-computa rotação inversa (1× por candidato, não por ponto amostrado)
      const rotA = this.getInverseRot(spriteA);
      const rotB = this.getInverseRot(cand);

      // Região de sobreposição em coordenadas do palco
      const x0 = Math.max(spriteA.x - wA / 2, cand.x - wB / 2);
      const x1 = Math.min(spriteA.x + wA / 2, cand.x + wB / 2);
      const y0 = Math.max(spriteA.y - hA / 2, cand.y - hB / 2);
      const y1 = Math.min(spriteA.y + hA / 2, cand.y + hB / 2);

      // Amostragem na região de overlap
      let hit = false;
      outer: for (let sy = y0 + SAMPLE_STEP / 2; sy < y1; sy += SAMPLE_STEP) {
        for (let sx = x0 + SAMPLE_STEP / 2; sx < x1; sx += SAMPLE_STEP) {
          if (this.sampleAlpha(spriteA, mA, sx, sy, rotA.cos, rotA.sin) > 10 && this.sampleAlpha(cand, mB, sx, sy, rotB.cos, rotB.sin) > 10) {
            hit = true;
            break outer;
          }
        }
      }

      this.touchCache.set(cacheKey, hit);
      if (hit) return true;
    }
    return false;
  }

  // ─── Hit-test de clique (sem GPU) ────────────────────────────────────────

  public isOpaqueAt(sprite: SpriteData, stageX: number, stageY: number): boolean {
    if (!sprite.costume) return true;
    this.ensureMask(sprite.costume);
    const m = this.maskCache.get(sprite.costume);
    if (!m || m === 'loading') return false; // enquanto carrega ou se falhar, ignora (evita drag no palco inteiro)

    const rot = this.getInverseRot(sprite);
    return this.sampleAlpha(sprite, m, stageX, stageY, rot.cos, rot.sin) > 10;
  }

  public getContentBounds(url: string | null) {
    if (!url) return null;
    this.ensureMask(url);
    const m = this.maskCache.get(url);
    if (!m || m === 'loading') return null;
    return {
      x: m.contentX,
      y: m.contentY,
      w: m.contentW,
      h: m.contentH,
      fullW: m.w,
      fullH: m.h
    };
  }

  // ─── WebGL: isTouchingColor ───────────────────────────────────────────────

  private colorMatch(r1: number, g1: number, b1: number, hexTarget: string, tolerance = 20): boolean {
    let tr = 0,
      tg = 0,
      tb = 0;
    if (hexTarget.startsWith('#')) {
      const h = hexTarget.substring(1);
      if (h.length === 3) {
        tr = parseInt(h[0] + h[0], 16);
        tg = parseInt(h[1] + h[1], 16);
        tb = parseInt(h[2] + h[2], 16);
      } else if (h.length === 6) {
        tr = parseInt(h.substring(0, 2), 16);
        tg = parseInt(h.substring(2, 4), 16);
        tb = parseInt(h.substring(4, 6), 16);
      }
    }
    return Math.abs(r1 - tr) <= tolerance && Math.abs(g1 - tg) <= tolerance && Math.abs(b1 - tb) <= tolerance;
  }

  public async isTouchingColor(targetSpriteId: string, hexColor: string, backdropUrl: string | null, sprites: SpriteData[]): Promise<boolean> {
    const gl = this.renderer.getGL();
    if (!gl) return false;
    const W = gl.canvas.width;
    const H = gl.canvas.height;

    const targetSprite = sprites.find((s) => s.id === targetSpriteId);
    if (!targetSprite || !targetSprite.visible) return false;
    const others = sprites.filter((s) => s.id !== targetSpriteId);

    await this.renderer.preload(backdropUrl, sprites as any[]);

    this.renderer.drawSceneSync(backdropUrl, others as any[]);
    const stagePixels = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, stagePixels);

    this.renderer.drawSceneSync(null, [targetSprite] as any[], [0.0, 0.0, 0.0, 0.0]);
    const targetPixels = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, targetPixels);

    this.renderer.drawSceneSync(backdropUrl, sprites as any[]);

    for (let i = 0; i < targetPixels.length; i += 4) {
      if (targetPixels[i + 3] > 10) {
        const sA = stagePixels[i + 3];
        if (sA > 10 && this.colorMatch(stagePixels[i], stagePixels[i + 1], stagePixels[i + 2], hexColor)) {
          return true;
        }
      }
    }
    return false;
  }

  public async isColorTouchingColor(
    targetSpriteId: string,
    hexSprite: string,
    hexStage: string,
    backdropUrl: string | null,
    sprites: SpriteData[],
  ): Promise<boolean> {
    const gl = this.renderer.getGL();
    if (!gl) return false;
    const W = gl.canvas.width;
    const H = gl.canvas.height;

    const targetSprite = sprites.find((s) => s.id === targetSpriteId);
    if (!targetSprite || !targetSprite.visible) return false;
    const others = sprites.filter((s) => s.id !== targetSpriteId);

    await this.renderer.preload(backdropUrl, sprites as any[]);

    this.renderer.drawSceneSync(backdropUrl, others as any[]);
    const stagePixels = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, stagePixels);

    this.renderer.drawSceneSync(null, [targetSprite] as any[], [0.0, 0.0, 0.0, 0.0]);
    const targetPixels = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, targetPixels);

    this.renderer.drawSceneSync(backdropUrl, sprites as any[]);

    for (let i = 0; i < targetPixels.length; i += 4) {
      if (targetPixels[i + 3] > 10 && this.colorMatch(targetPixels[i], targetPixels[i + 1], targetPixels[i + 2], hexSprite)) {
        const sA = stagePixels[i + 3];
        if (sA > 10 && this.colorMatch(stagePixels[i], stagePixels[i + 1], stagePixels[i + 2], hexStage)) {
          return true;
        }
      }
    }
    return false;
  }
}

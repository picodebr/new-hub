/**
 * TextureManager.ts
 * Gerenciador de texturas WebGL para as fantasias do PiCode.
 */

export class TextureManager {
    private gl: WebGL2RenderingContext;
    private textureCache = new Map<string, { tex: WebGLTexture, width: number, height: number }>();
    private pendingHires = new Map<string, Promise<{ tex: WebGLTexture, width: number, height: number }>>();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    /**
     * Remove tudo do cache (usado quando fechamos um projeto)
     */
    clearCache() {
        for (const entry of this.textureCache.values()) {
            this.gl.deleteTexture(entry.tex);
        }
        this.textureCache.clear();
        this.pendingHires.clear();
    }

    /**
     * Retorna a textura de forma síncrona.
     * Use APENAS se tiver certeza que ela já foi pre-carregada.
     */
    getTextureSync(url: string | null): { tex: WebGLTexture, width: number, height: number } | null {
        if (!url) return null;
        return this.textureCache.get(url) || null;
    }

    /**
     * Inicia o carregamento de uma textura em background (fire-and-forget).
     */
    startLoading(url: string | null): void {
        if (!url || url === '/img/empty.png') return;
        if (this.textureCache.has(url) || this.pendingHires.has(url)) return;
        this.loadTexture(url).catch(() => {});
    }

    /**
     * Carrega uma imagem de forma assíncrona, faz upload pra GPU e a retorna.
     */
    async loadTexture(url: string | null): Promise<{ tex: WebGLTexture | null, width: number, height: number }> {
        if (!url || url === '/img/empty.png') return { tex: null, width: 0, height: 0 };

        if (this.textureCache.has(url)) return this.textureCache.get(url)!;
        if (this.pendingHires.has(url)) return this.pendingHires.get(url)!;

        const promise = (async () => {
            try {
                // Estratégia de Alta Resolução para SVGs:
                // Forçamos a rasterização em uma resolução alvo alta (ex: 2048px)
                if (url.includes('.svg') || url.startsWith('data:image/svg+xml')) {
                    const res = await this.loadSvgHighRes(url);
                    return this.uploadToGpu(url, res.source, res.width, res.height);
                }

                // Imagens normais (PNG/JPG)
                return new Promise<{ tex: WebGLTexture, width: number, height: number }>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        const result = this.uploadToGpu(url, img, img.naturalWidth || img.width, img.naturalHeight || img.height);
                        resolve(result);
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            } catch (err) {
                this.pendingHires.delete(url);
                throw err;
            }
        })();

        this.pendingHires.set(url, promise);
        return promise;
    }

    private uploadToGpu(
        url: string, 
        source: HTMLImageElement | HTMLCanvasElement, 
        logicalW: number, 
        logicalH: number
    ): { tex: WebGLTexture, width: number, height: number } {
        const tex = this.gl.createTexture();
        if (!tex) throw new Error("Falha ao criar WebGLTexture");

        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        // Não pré-multiplica o alpha aqui; o shader faz isso no output
        // para manter consistência com premultipliedAlpha:false do contexto WebGL2
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
        
        // Usa formato interno RGBA8 do WebGL 2 para maior precisão
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA8, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        // Habilita Anisotropia se disponível (melhora muito a nitidez em downscaling)
        const ext = this.gl.getExtension('EXT_texture_filter_anisotropic') || 
                    this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || 
                    this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        if (ext) {
            const max = this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.gl.texParameterf(this.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }

        const result = { tex, width: logicalW, height: logicalH };
        this.textureCache.set(url, result);
        this.pendingHires.delete(url);
        return result;
    }

    private async loadSvgHighRes(url: string): Promise<{ source: HTMLCanvasElement, width: number, height: number }> {
        const response = await fetch(url);
        let svgText = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (!svgElement) throw new Error("SVG inválido");

        const viewBox = svgElement.getAttribute('viewBox');
        let logicalW = 480, logicalH = 360;

        if (viewBox) {
            const parts = viewBox.split(/\s+/).map(Number);
            if (parts.length === 4) {
                logicalW = parts[2];
                logicalH = parts[3];
            }
        } else {
            logicalW = parseFloat(svgElement.getAttribute('width') || '480');
            logicalH = parseFloat(svgElement.getAttribute('height') || '360');
        }

        // Resolução de renderização interna (4096px na maior dimensão para nitidez em telas grandes)
        const targetRes = 4096;
        const scale = targetRes / Math.max(logicalW, logicalH);
        const renderW = logicalW * scale;
        const renderH = logicalH * scale;

        svgElement.setAttribute('width', renderW.toString());
        svgElement.setAttribute('height', renderH.toString());

        const serialized = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = renderW;
                canvas.height = renderH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, renderW, renderH);
                }
                URL.revokeObjectURL(blobUrl);
                resolve({ source: canvas, width: logicalW, height: logicalH });
            };
            img.onerror = reject;
            img.src = blobUrl;
        });
    }
}

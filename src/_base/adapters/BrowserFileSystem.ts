import { getPresignedUrl, uploadFile } from '../services/upload';

const MAX_FILE_SIZE_MB = 10;
const MAX_SPRITE_DIMENSION = 1440; // Qualidade suficiente para telas de alta densidade
const MAX_BACKDROP_DIMENSION = 1920; // Full HD para backdrops em telas grandes

export class BrowserFileSystem {
  public static async readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  public static async processFile(file: File, isBackdrop: boolean = false): Promise<string> {
    // 1. Validação básica de tamanho (10MB)
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`O arquivo é muito grande! O limite é de ${MAX_FILE_SIZE_MB}MB.`);
    }

    // 2. Trata SVG: Faz o upload diretamente do arquivo original para o S3
    if (file.type === 'image/svg+xml') {
      return this.uploadToS3(file);
    }

    const maxDim = isBackdrop ? MAX_BACKDROP_DIMENSION : MAX_SPRITE_DIMENSION;

    // 3. Trata Bitmaps: Carrega, redimensiona se necessário e envia pro S3
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        // Transformamos o onload em async para lidar com o await do S3
        img.onload = async () => {
          try {
            let { width, height } = img;

            // Se a imagem já estiver dentro dos limites, envia o arquivo original para o S3
            if (width <= maxDim && height <= maxDim) {
              const s3Url = await this.uploadToS3(file);
              resolve(s3Url);
              return;
            }

            // Redimensiona se alguma dimensão exceder o limite
            const ratio = Math.min(maxDim / width, maxDim / height);
            width *= ratio;
            height *= ratio;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              // Fallback de segurança: envia o arquivo original se falhar a criação do contexto 2D
              const s3Url = await this.uploadToS3(file);
              resolve(s3Url);
              return;
            }

            // Aplica um smoothing de alta qualidade para o redimensionamento
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            const type = file.type || 'image/png';

            // Usamos toBlob para extrair o binário do canvas e reconstruir um objeto File
            canvas.toBlob(
              async (blob) => {
                if (!blob) {
                  reject(new Error('Falha ao extrair a imagem processada do canvas.'));
                  return;
                }

                // Cria um novo arquivo mantendo o nome original e o tipo
                const processedFile = new File([blob], file.name, {
                  type: type,
                  lastModified: Date.now(),
                });

                // Faz o upload da imagem recém-processada
                const s3Url = await this.uploadToS3(processedFile);
                resolve(s3Url);
              },
              type,
              0.95,
            ); // Qualidade 0.95
          } catch (error) {
            // Captura erros no fluxo do async/await dentro do callback
            reject(error);
          }
        };

        img.onerror = reject;
        img.src = e.target?.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static async uploadToS3(file: File): Promise<string> {
    const { link, full_path } = await getPresignedUrl(file.type, `code-assets`, `public-read`);
    await uploadFile(link, file);
    return full_path;
  }
}

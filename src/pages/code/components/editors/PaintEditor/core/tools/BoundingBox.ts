/**
 * BoundingBox - Representação visual e lógica da seleção.
 *
 * Responsabilidade: Desenhar o retângulo pontilhado e as alças de
 * transformação (escala/rotação) ao redor dos itens selecionados.
 * Gerencia o "Anti-Zoom", garantindo que as alças mantenham o mesmo
 * tamanho visual na tela independente do nível de zoom do canvas.
 */
import { IPaintItem } from '@/_base/domain/entities/IPaintEditor';

export class BoundingBox {
  private grupo: paper.Group;
  private caixa: paper.Path.Rectangle;
  private alcas: { [key: string]: paper.Path.Circle } = {};
  private linhaRotacao: paper.Path.Line;
  private alcaRotacao: paper.Path.Circle;
  private scope: paper.PaperScope;

  private readonly RAIO_ALCA = 3;
  private readonly DISTANCIA_ROTACAO = 30;

  constructor(scope: paper.PaperScope) {
    this.scope = scope;

    if (!this.scope.project) {
      throw new Error('[BoundingBox] scope.project is null — canvas não está pronto.');
    }

    let camadaUI = this.scope.project.layers.find((l) => (l as IPaintItem).name === 'ui');
    if (!camadaUI) {
      camadaUI = new this.scope.Layer();
      (camadaUI as IPaintItem).name = 'ui';
    }

    this.grupo = new this.scope.Group();
    camadaUI.addChild(this.grupo);

    this.grupo.name = 'bounding-box';
    (this.grupo as IPaintItem).guide = true;
    this.grupo.locked = true;

    this.caixa = new this.scope.Path.Rectangle(new this.scope.Rectangle(0, 0, 10, 10));
    this.caixa.strokeColor = new this.scope.Color('#4483ff');
    this.caixa.strokeWidth = 1.5;
    this.caixa.dashArray = [4, 4];
    this.caixa.fillColor = new this.scope.Color(0, 0, 0, 0.0001);
    this.grupo.addChild(this.caixa);

    const nomesAlcas = ['tl', 'tc', 'tr', 'rc', 'br', 'bc', 'bl', 'lc'];

    nomesAlcas.forEach((nome) => {
      const alca = new this.scope.Path.Circle({
        center: [0, 0],
        radius: this.RAIO_ALCA,
        fillColor: new this.scope.Color('#ffffff'),
        strokeColor: new this.scope.Color('#4483ff'),
        strokeWidth: 2,
      });
      this.alcas[nome] = alca;
      this.grupo.addChild(alca);
    });

    this.linhaRotacao = new this.scope.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new this.scope.Color('#4483ff'),
      strokeWidth: 2,
    });
    this.grupo.addChild(this.linhaRotacao);

    this.alcaRotacao = new this.scope.Path.Circle({
      center: [0, 0],
      radius: 6,
      fillColor: new this.scope.Color('#4483ff'),
      strokeColor: new this.scope.Color('#ffffff'),
      strokeWidth: 2,
    });
    this.grupo.addChild(this.alcaRotacao);

    this.esconder();
  }

  public atualizar(items: paper.Item[], rotation: number = 0, center?: paper.Point) {
    // Reseta transform para identidade antes de atualizar geometria
    this.grupo.matrix.reset();

    if (!items || items.length === 0) {
      this.esconder();
      return;
    }

    let limitesTotais: paper.Rectangle | null = null;
    for (const item of items) {
      // Otimização de performance extrema: item.strokeBounds é muito pesado para rodar a 60 FPS.
      // Usamos item.bounds e expandimos matematicamente pela metade da borda.
      let bounds = item.bounds.clone();
      if (item.strokeWidth && item.strokeWidth > 0) {
         bounds = bounds.expand(item.strokeWidth);
      }

      if (!limitesTotais) {
        limitesTotais = bounds.clone();
      } else {
        limitesTotais = limitesTotais.unite(bounds);
      }
    }

    if (!limitesTotais) {
      this.esconder();
      return;
    }

    this.mostrar();

    // Em vez de usar `this.caixa.bounds = limitesTotais` (que quebra se o objeto tiver
    // largura ou altura zero, como uma linha reta, pois a escala por zero vira infinito),
    // recriamos ou modificamos os pontos diretamente.
    this.caixa.segments[0].point = limitesTotais.bottomLeft;
    this.caixa.segments[1].point = limitesTotais.topLeft;
    this.caixa.segments[2].point = limitesTotais.topRight;
    this.caixa.segments[3].point = limitesTotais.bottomRight;
    
    const b = limitesTotais;

    this.alcas['tl'].position = b.topLeft;
    this.alcas['tc'].position = b.topCenter;
    this.alcas['tr'].position = b.topRight;
    this.alcas['rc'].position = b.rightCenter;
    this.alcas['br'].position = b.bottomRight;
    this.alcas['bc'].position = b.bottomCenter;
    this.alcas['bl'].position = b.bottomLeft;
    this.alcas['lc'].position = b.leftCenter;

    // ✨ ANTI-ZOOM:
    // Calculamos um fator baseado no zoom atual da View para que
    // elementos de interface (linhas pontilhadas, alças) não fiquem
    // gigantes quando o usuário dá zoom, mantendo a clareza da UI.
    const zoomAtivo = this.scope.view.zoom;
    const fatorAntiZoom = 1 / zoomAtivo;
    const distanciaRotacaoReal = this.DISTANCIA_ROTACAO * fatorAntiZoom;

    const pontoRotacao = b.topCenter.subtract(new this.scope.Point(0, distanciaRotacaoReal));
    this.linhaRotacao.segments[0].point = b.topCenter;
    this.linhaRotacao.segments[1].point = pontoRotacao;
    this.alcaRotacao.position = pontoRotacao;

    // ✨ NOVO: Ajuste de escala visual (Anti-Zoom)
    this.caixa.strokeWidth = 1.5 * fatorAntiZoom;
    this.linhaRotacao.strokeWidth = 2 * fatorAntiZoom;

    const boundsBase = this.RAIO_ALCA * 2 * fatorAntiZoom;
    Object.values(this.alcas).forEach((alca) => {
      alca.bounds.width = boundsBase;
      alca.bounds.height = boundsBase;
      alca.strokeWidth = 2 * fatorAntiZoom;
    });

    // O raio original é 6, então o diâmetro é 12
    this.alcaRotacao.bounds.width = 12 * fatorAntiZoom;
    this.alcaRotacao.bounds.height = 12 * fatorAntiZoom;
    this.alcaRotacao.strokeWidth = 2 * fatorAntiZoom;

    // Apply orientation to the whole group
    if (rotation !== 0 && center) {
      this.grupo.pivot = center;
      this.grupo.rotation = rotation;
    }

    if (this.grupo.parent) {
      this.grupo.bringToFront();
    }
  }

  public testarColisaoAlcas(ponto: paper.Point): string | null {
    if (!this.grupo.visible) return null;

    // ✨ NOVO: Tolerância ajustada pelo zoom
    const zoomAtivo = this.scope.view.zoom;
    const toleranciaDinamica = (this.RAIO_ALCA + 4) / zoomAtivo;
    const toleranciaRotacao = (6 + 4) / zoomAtivo; // Raio 6 + 4 de margem

    if (this.alcaRotacao.position.getDistance(ponto) <= toleranciaRotacao) {
      return 'rotate';
    }

    for (const [nome, alca] of Object.entries(this.alcas)) {
      if (alca.position.getDistance(ponto) <= toleranciaDinamica) {
        return `scale-${nome}`;
      }
    }

    return null;
  }

  public testarColisaoCaixa(ponto: paper.Point): boolean {
    if (!this.grupo.visible) return false;
    return this.caixa.contains(ponto) || this.caixa.strokeBounds.contains(ponto);
  }

  public esconder() {
    this.grupo.visible = false;
  }

  public traduzir(delta: paper.Point) {
    if (!this.grupo.visible) return;
    this.grupo.position = this.grupo.position.add(delta);
  }

  public rotacionarVisuais(angulo: number, centro: paper.Point) {
    if (!this.grupo.visible) return;
    this.grupo.pivot = centro;
    this.grupo.rotation = angulo;
  }

  public mostrar() {
    this.grupo.visible = true;
  }

  public obterLimites(): paper.Rectangle {
    return this.caixa.bounds;
  }

  public remover() {
    this.grupo.remove();
  }
}

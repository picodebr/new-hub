/**
 * SVG sanitization and normalization service.
 * Mirroring scratch-svg-renderer logic for perfect compatibility.
 * References: scratch-svg-renderer/src/fixup-svg-string.js, load-svg-string.js
 */

export type ImageFormat = 'svg' | 'png' | 'jpg';

/**
 * Detect image format from a URL, data URI, or raw SVG string.
 */
export function detectFormat(url: string): ImageFormat {
  const trimmed = url.trim();
  if (
    trimmed.startsWith('<svg') ||
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('data:image/svg') ||
    url.toLowerCase().includes('.svg')
  ) {
    return 'svg';
  }
  if (
    trimmed.startsWith('data:image/jpeg') ||
    url.toLowerCase().includes('.jpg') ||
    url.toLowerCase().includes('.jpeg')
  ) {
    return 'jpg';
  }
  return 'png';
}

/**
 * Pre-parse fixups — mirrors scratch-svg-renderer/src/fixup-svg-string.js.
 * Corrects common authoring quirks before DOMParser sees the string.
 */
export function fixupSvgString(svgString: string): string {
  // Strip BOM if present
  if (svgString.charCodeAt(0) === 0xFEFF) {
    svgString = svgString.slice(1);
  }

  // Add root svg namespace if it does not exist and force version 1.1
  const svgAttrs = svgString.match(/<svg [^>]*>/);
  if (svgAttrs) {
    let newTag = svgAttrs[0];
    if (newTag.indexOf('xmlns=') === -1) {
      newTag = newTag.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }
    // Force version 1.1 (Scratch standard)
    if (newTag.includes('version=')) {
      newTag = newTag.replace(/version=["'][^"']*["']/, 'version="1.1"');
    } else {
      newTag = newTag.replace('<svg ', '<svg version="1.1" ');
    }
    
    // Illustrator entities fix: Replace undeclared ns_ entities
    if (newTag.indexOf('&ns_') !== -1 && svgString.indexOf('<!DOCTYPE') === -1) {
      newTag = newTag.replace(/&ns_[^;]+;/g, 'http://ns.adobe.com/Extensibility/1.0/');
    }
    
    svgString = svgString.replace(svgAttrs[0], newTag);
  }

  // Remove XML declaration and DOCTYPE ([\s\S] matches newlines)
  svgString = svgString.replace(/<\?xml[\s\S]*?\?>/gi, '');
  svgString = svgString.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

  // Photoshop invalid mime type fix: data:img/png -> data:image/png
  if (svgString.includes('data:img/png')) {
    svgString = svgString.replace(
      /(<image[^>]+?xlink:href=["'])data:img\/png/g,
      (_$0, $1) => `${$1}data:image/png`,
    );
  }

  // Inkscape namespace fix
  const xmlnsRegex = /(<[^>]+?xmlns:(?!xml=)[^ ]+=)"http:\/\/www\.w3\.org\/XML\/1998\/namespace"/g;
  if (xmlnsRegex.test(svgString)) {
    svgString = svgString.replace(xmlnsRegex, (_$0, $1) => `${$1}"http://dummy.namespace"`);
  }

  // Strip Inkscape's svg: tag prefix
  svgString = svgString.replace(/<(\/?)\s*svg:/g, '<$1');

  // Empty <metadata> and <script> tags aggressively (Scratch uses [\s\S]* to catch everything)
  svgString = svgString.replace(/<metadata>[\s\S]*?<\/metadata>/g, '<metadata></metadata>');
  svgString = svgString.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/g, '<script></script>');

  // Remove javascript: href attributes
  svgString = svgString.replace(/\s(href|xlink:href)=["']javascript:[^"']*["']/gi, '');

  return svgString.trim();
}

/**
 * Find the largest stroke width in the SVG to correctly calculate bounding box.
 */
function findLargestStrokeWidth(rootNode: SVGElement): number {
  let largestStrokeWidth = 0;
  const collect = (domElement: Element) => {
    if (domElement.getAttribute) {
      if (domElement.getAttribute('stroke')) {
        largestStrokeWidth = Math.max(largestStrokeWidth, 1);
      }
      const sw = domElement.getAttribute('stroke-width');
      if (sw) {
        largestStrokeWidth = Math.max(largestStrokeWidth, parseFloat(sw) || 0);
      }
    }
    for (let i = 0; i < domElement.childNodes.length; i++) {
      const child = domElement.childNodes[i];
      if (child.nodeType === 1) collect(child as Element);
    }
  };
  collect(rootNode);
  return largestStrokeWidth;
}

/**
 * Apply Scratch-specific quirks to the SVG DOM.
 */
function transformQuirks(svgTag: SVGSVGElement): void {
  // 1. Image rendering: optimizespeed / pixelated (Scratch standard)
  const images = svgTag.querySelectorAll('image');
  images.forEach(img => {
    const style = img.getAttribute('style') || '';
    if (!style.includes('image-rendering')) {
      img.setAttribute('style', `image-rendering: optimizespeed; image-rendering: pixelated; ${style}`);
    }
  });

  // 2. Gradients: Ensure x2="0" if missing (Scratch 2 logic)
  const gradients = svgTag.querySelectorAll('linearGradient');
  gradients.forEach(grad => {
    if (!grad.getAttribute('x2')) grad.setAttribute('x2', '0');
  });

  // 3. Text: Scratch-style text alignment
  const texts = svgTag.querySelectorAll('text');
  texts.forEach(txt => {
    txt.removeAttribute('x');
    txt.removeAttribute('y');
    txt.setAttribute('alignment-baseline', 'text-before-edge');
    txt.setAttribute('xml:space', 'preserve');
    if (!txt.getAttribute('font-size')) txt.setAttribute('font-size', '18');
  });
}

/**
 * Ensure the SVG element has explicit width, height, and viewBox attributes.
 * Mirrors scratch-svg-renderer's transformMeasurements.
 */
export function normalizeSvgDimensions(svgTag: SVGSVGElement): void {
  // Recalculate measurements by mounting temporarily
  const spot = document.createElement('span');
  spot.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;top:-10000px;left:-10000px;';
  let bbox: DOMRect | null = null;
  
  try {
    // We use innerHTML to ensure the styles are parsed in context
    spot.innerHTML = svgTag.outerHTML;
    document.body.appendChild(spot);
    const mounted = spot.children[0] as SVGSVGElement;
    bbox = mounted.getBBox();
  } catch (e) {
    console.warn('[svgRenderer] getBBox failed:', e);
  } finally {
    document.body.removeChild(spot);
  }

  if (bbox) {
    // Scratch enlarges the bbox based on half stroke width
    let halfStrokeWidth = 0;
    if (bbox.width !== 0 && bbox.height !== 0) {
      halfStrokeWidth = findLargestStrokeWidth(svgTag) / 2;
    }

    const width = bbox.width + (halfStrokeWidth * 2);
    const height = bbox.height + (halfStrokeWidth * 2);
    const x = bbox.x - halfStrokeWidth;
    const y = bbox.y - halfStrokeWidth;

    svgTag.setAttribute('width', String(width));
    svgTag.setAttribute('height', String(height));
    svgTag.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  } else if (svgTag.getAttribute('viewBox')) {
    // Fallback if getBBox failed but viewBox is present
    svgTag.setAttribute('width', String(svgTag.viewBox.baseVal.width));
    svgTag.setAttribute('height', String(svgTag.viewBox.baseVal.height));
  }
}

/**
 * Parse a sanitized SVG string into an SVGSVGElement.
 */
export function parseSvgString(svgString: string): SVGSVGElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'text/xml');

  if (
    doc.documentElement.localName !== 'svg' ||
    doc.querySelector('parsererror')
  ) {
    const htmlDoc = parser.parseFromString(svgString, 'text/html');
    const svgEl = htmlDoc.querySelector('svg');
    if (!svgEl) throw new Error('[svgRenderer] Document is not valid SVG.');
    return svgEl as unknown as SVGSVGElement;
  }

  return doc.documentElement as unknown as SVGSVGElement;
}

/**
 * Full pipeline (Sync): fixup → parse → quirks → normalize dimensions → serialize.
 * Replaces any existing width/height/viewBox with true content measurements.
 */
export function normalizeSvgString(svgString: string, skipNormalization: boolean = false): string {
  const fixed = fixupSvgString(svgString);
  const svgElement = parseSvgString(fixed);
  
  // Apply Scratch quirks
  transformQuirks(svgElement);
  
  // Apply measurements (getBBox)
  if (!skipNormalization) {
    normalizeSvgDimensions(svgElement);
  }
  
  return serializeSvg(svgElement);
}

/**
 * Full pipeline (Async): decode URL → normalizeSvgString.
 */
export async function loadAndNormalizeSvg(url: string): Promise<{ svgElement: SVGSVGElement; svgString: string }> {
  const raw = await decodeSvgUrl(url);
  const svgString = normalizeSvgString(raw);
  const svgElement = parseSvgString(svgString);
  return { svgElement, svgString };
}

/**
 * Decode a raw URL into a plain SVG string.
 */
export async function decodeSvgUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (trimmed.startsWith('<')) return trimmed;

  if (trimmed.startsWith('data:image/svg+xml;base64,')) {
    const base64 = trimmed.slice('data:image/svg+xml;base64,'.length);
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  if (trimmed.startsWith('data:image/svg+xml,')) {
    return decodeURIComponent(trimmed.slice('data:image/svg+xml,'.length));
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`[svgRenderer] Failed to fetch SVG: ${res.status}`);
  return res.text();
}

/**
 * Serialize an SVGSVGElement back to a string.
 */
export function serializeSvg(svgElement: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(svgElement);
}

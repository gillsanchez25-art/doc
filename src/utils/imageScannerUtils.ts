export type EnhancementFilter = 'auto' | 'bw_document' | 'aero_seal' | 'grayscale' | 'none';

/**
 * Applies digital scanning filters to an HTML5 canvas
 */
export function applyFilterToCanvas(
  sourceCanvas: HTMLCanvasElement,
  filter: EnhancementFilter
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  if (filter === 'none') return outputCanvas;

  const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const d = imgData.data;

  if (filter === 'auto') {
    // Auto Contrast & White-point stretch
    let minLum = 255;
    let maxLum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
    const range = Math.max(maxLum - minLum, 1);
    for (let i = 0; i < d.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = ((d[i + c] - minLum) / range) * 255;
        // Mild gamma correction for text readability
        val = Math.pow(val / 255, 0.85) * 255;
        d[i + c] = Math.min(255, Math.max(0, val));
      }
    }
  } else if (filter === 'bw_document') {
    // High-contrast clean B&W document thresholding
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const threshold = 145;
      const v = lum > threshold ? 255 : Math.max(0, lum * 0.4);
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  } else if (filter === 'aero_seal') {
    // Preserves and boosts blue/red ink seals and stamps while whitening off-white paper
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Detect blue stamp/ink
      const isBlueInk = b > r + 25 && b > g + 15;
      // Detect red stamp
      const isRedInk = r > g + 30 && r > b + 30;

      if (isBlueInk) {
        d[i] = Math.max(0, r * 0.6);
        d[i + 1] = Math.min(255, g * 1.1);
        d[i + 2] = Math.min(255, b * 1.3);
      } else if (isRedInk) {
        d[i] = Math.min(255, r * 1.3);
        d[i + 1] = Math.max(0, g * 0.7);
        d[i + 2] = Math.max(0, b * 0.7);
      } else if (lum > 170) {
        // Whiten background paper
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
      } else {
        // Darken text for high contrast
        d[i] = Math.max(0, r * 0.7);
        d[i + 1] = Math.max(0, g * 0.7);
        d[i + 2] = Math.max(0, b * 0.7);
      }
    }
  } else if (filter === 'grayscale') {
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = lum;
      d[i + 1] = lum;
      d[i + 2] = lum;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

export interface CropBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type FramingPreset = 'auto' | 'id_card' | 'a4_cert' | 'full';

/**
 * Normalizes any crop box coordinates (supporting 0..1 scale, 0..1000 scale, and inversion)
 */
export function normalizeCropBox(
  box: CropBox | null | undefined,
  imgWidth: number,
  imgHeight: number,
  paddingPercent: number = 0
): { x: number; y: number; width: number; height: number } {
  if (!box) {
    return { x: 0, y: 0, width: imgWidth, height: imgHeight };
  }

  // Detect scale: 0..1 vs 0..1000
  const isZeroToOne = box.ymax <= 1.05 && box.xmax <= 1.05 && (box.ymax > 0 || box.xmax > 0);
  const scale = isZeroToOne ? 1.0 : 1000.0;

  let ymin = Math.max(0, (box.ymin / scale) * imgHeight);
  let xmin = Math.max(0, (box.xmin / scale) * imgWidth);
  let ymax = Math.min(imgHeight, (box.ymax / scale) * imgHeight);
  let xmax = Math.min(imgWidth, (box.xmax / scale) * imgWidth);

  // If inverted, swap
  if (ymin > ymax) { const t = ymin; ymin = ymax; ymax = t; }
  if (xmin > xmax) { const t = xmin; xmin = xmax; xmax = t; }

  // Apply slight safety padding if requested
  if (paddingPercent > 0) {
    const padY = (ymax - ymin) * (paddingPercent / 100);
    const padX = (xmax - xmin) * (paddingPercent / 100);
    ymin = Math.max(0, ymin - padY);
    xmin = Math.max(0, xmin - padX);
    ymax = Math.min(imgHeight, ymax + padY);
    xmax = Math.min(imgWidth, xmax + padX);
  }

  const width = Math.max(20, xmax - xmin);
  const height = Math.max(20, ymax - ymin);

  return {
    x: Math.round(xmin),
    y: Math.round(ymin),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Computer Vision edge & background detector: detects document boundaries by checking border contrast
 */
export function detectDocumentEdges(
  img: HTMLImageElement | HTMLCanvasElement
): CropBox {
  const canvas = document.createElement('canvas');
  const w = Math.min(600, img.width);
  const h = Math.round((w / img.width) * img.height);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ymin: 15, xmin: 15, ymax: 985, xmax: 985 };

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Helper to get luminance at x, y
  const getLum = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  };

  // Corner baseline colors (average of 4 corners to identify background/desk)
  const cornerSampleCount = 6;
  let cornerLumSum = 0;
  for (let i = 0; i < cornerSampleCount; i++) {
    cornerLumSum += getLum(i, i);
    cornerLumSum += getLum(w - 1 - i, i);
    cornerLumSum += getLum(i, h - 1 - i);
    cornerLumSum += getLum(w - 1 - i, h - 1 - i);
  }
  const bgAvgLum = cornerLumSum / (cornerSampleCount * 4);

  // Scan from Top
  let topCut = 0;
  for (let y = 0; y < Math.floor(h * 0.35); y += 2) {
    let rowDiffSum = 0;
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x += 6) {
      if (Math.abs(getLum(x, y) - bgAvgLum) > 28) rowDiffSum++;
    }
    if (rowDiffSum > 5) {
      topCut = Math.max(0, y - 4);
      break;
    }
  }

  // Scan from Bottom
  let bottomCut = h;
  for (let y = h - 1; y > Math.floor(h * 0.65); y -= 2) {
    let rowDiffSum = 0;
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x += 6) {
      if (Math.abs(getLum(x, y) - bgAvgLum) > 28) rowDiffSum++;
    }
    if (rowDiffSum > 5) {
      bottomCut = Math.min(h, y + 4);
      break;
    }
  }

  // Scan from Left
  let leftCut = 0;
  for (let x = 0; x < Math.floor(w * 0.35); x += 2) {
    let colDiffSum = 0;
    for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y += 6) {
      if (Math.abs(getLum(x, y) - bgAvgLum) > 28) colDiffSum++;
    }
    if (colDiffSum > 5) {
      leftCut = Math.max(0, x - 4);
      break;
    }
  }

  // Scan from Right
  let rightCut = w;
  for (let x = w - 1; x > Math.floor(w * 0.65); x -= 2) {
    let colDiffSum = 0;
    for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y += 6) {
      if (Math.abs(getLum(x, y) - bgAvgLum) > 28) colDiffSum++;
    }
    if (colDiffSum > 5) {
      rightCut = Math.min(w, x + 4);
      break;
    }
  }

  // Convert to 0..1000 coordinates
  const ymin = Math.round((topCut / h) * 1000);
  const ymax = Math.round((bottomCut / h) * 1000);
  const xmin = Math.round((leftCut / w) * 1000);
  const xmax = Math.round((rightCut / w) * 1000);

  // If detected area is suspicious (<25% or >98% of image), use soft 1.5% edge clean
  const areaRatio = ((ymax - ymin) * (xmax - xmin)) / 1000000;
  if (areaRatio < 0.25 || areaRatio > 0.98) {
    return { ymin: 15, xmin: 15, ymax: 985, xmax: 985 };
  }

  return { ymin, xmin, ymax, xmax };
}

/**
 * Rotates an image by 90, 180, or 270 degrees
 */
export async function rotateImage(imageSource: string, degrees: number = 90): Promise<string> {
  const normDeg = ((degrees % 360) + 360) % 360;
  if (normDeg === 0) return imageSource;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const is90or270 = normDeg === 90 || normDeg === 270;
      canvas.width = is90or270 ? img.height : img.width;
      canvas.height = is90or270 ? img.width : img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageSource);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normDeg * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };
    img.onerror = () => resolve(imageSource);
    img.src = imageSource;
  });
}

/**
 * Crops a normalized bounding box [ymin, xmin, ymax, xmax] (0 to 1000) from an image,
 * with optional framing presets (ID card, A4 cert, auto, or full).
 */
export async function cropImageToBox(
  imageSource: string,
  box?: CropBox | null,
  preset: FramingPreset = 'auto'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Determine target box
      let targetBox = box;
      if (!targetBox || (targetBox.ymin === 0 && targetBox.xmin === 0 && targetBox.ymax === 1000 && targetBox.xmax === 1000)) {
        // Run edge detection
        targetBox = detectDocumentEdges(img);
      }

      const rect = normalizeCropBox(targetBox, img.width, img.height, 0.5);

      let cropX = rect.x;
      let cropY = rect.y;
      let cropW = rect.width;
      let cropH = rect.height;

      // Handle presets
      if (preset === 'id_card') {
        // Standard ISO/IEC 7810 ID-1 card (85.6 mm x 53.98 mm = 1.5858)
        const targetRatio = 85.6 / 53.98;
        const currentRatio = cropW / cropH;
        if (currentRatio > targetRatio) {
          const newH = Math.min(img.height, Math.round(cropW / targetRatio));
          cropY = Math.max(0, cropY - Math.round((newH - cropH) / 2));
          cropH = newH;
        } else {
          const newW = Math.min(img.width, Math.round(cropH * targetRatio));
          cropX = Math.max(0, cropX - Math.round((newW - cropW) / 2));
          cropW = newW;
        }
      } else if (preset === 'a4_cert') {
        const isLandscape = cropW > cropH;
        const targetRatio = isLandscape ? 1.414 : (1 / 1.414);
        const currentRatio = cropW / cropH;
        if (Math.abs(currentRatio - targetRatio) > 0.08) {
          if (currentRatio > targetRatio) {
            const newH = Math.min(img.height, Math.round(cropW / targetRatio));
            cropY = Math.max(0, cropY - Math.round((newH - cropH) / 2));
            cropH = newH;
          } else {
            const newW = Math.min(img.width, Math.round(cropH * targetRatio));
            cropX = Math.max(0, cropX - Math.round((newW - cropW) / 2));
            cropW = newW;
          }
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageSource);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };
    img.onerror = () => resolve(imageSource);
    img.src = imageSource;
  });
}

/**
 * Combines front and back sides into a single certified scan sheet with aeronautical headers,
 * normalized scale, and elegant framing.
 */
export async function combineFrontAndBack(
  frontDataUrl: string,
  backDataUrl: string,
  filter: EnhancementFilter = 'auto'
): Promise<string> {
  return new Promise((resolve) => {
    const frontImg = new Image();
    frontImg.crossOrigin = 'anonymous';
    frontImg.onload = () => {
      const backImg = new Image();
      backImg.crossOrigin = 'anonymous';
      backImg.onload = () => {
        // Normalize both to same visual height for clean layout
        const targetH = 500;
        const frontScale = targetH / frontImg.height;
        const frontW = Math.round(frontImg.width * frontScale);

        const backScale = targetH / backImg.height;
        const backW = Math.round(backImg.width * backScale);

        const padding = 24;
        const headerHeight = 44;
        const width = frontW + backW + padding * 3;
        const height = targetH + padding * 2 + headerHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(frontDataUrl);

        // Aviation technical background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        // Header technical separator
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding + headerHeight - 10);
        ctx.lineTo(width - padding, padding + headerHeight - 10);
        ctx.stroke();

        // Front header
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('ANVERSO · CREDENCIAL OFICIAL DE VUELO', padding + 4, padding + 18);

        // Back header
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('REVERSO · HABILITACIONES & SELLOS OFICIALES', frontW + padding * 2 + 4, padding + 18);

        // Process individual cards with the chosen filter before composition
        const processCard = (img: HTMLImageElement, w: number, h: number): HTMLCanvasElement => {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const cx = c.getContext('2d');
          if (cx) {
            cx.drawImage(img, 0, 0, w, h);
            return applyFilterToCanvas(c, filter);
          }
          return c;
        };

        const filteredFront = processCard(frontImg, frontW, targetH);
        const filteredBack = processCard(backImg, backW, targetH);

        // Draw framed front card with subtle drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(filteredFront, padding, padding + headerHeight, frontW, targetH);
        ctx.restore();

        // Border around front
        ctx.strokeStyle = '#38bdf840';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding + headerHeight, frontW, targetH);

        // Draw framed back card
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(filteredBack, frontW + padding * 2, padding + headerHeight, backW, targetH);
        ctx.restore();

        // Border around back
        ctx.strokeStyle = '#64748b40';
        ctx.lineWidth = 2;
        ctx.strokeRect(frontW + padding * 2, padding + headerHeight, backW, targetH);

        resolve(canvas.toDataURL('image/jpeg', 0.94));
      };
      backImg.onerror = () => resolve(frontDataUrl);
      backImg.src = backDataUrl;
    };
    frontImg.onerror = () => resolve(frontDataUrl);
    frontImg.src = frontDataUrl;
  });
}

/**
 * Generate simulated authentic aviation document scans for instant 1-click testing
 */
export function generateSampleAviationScan(
  type: 'license_front' | 'license_back' | 'medical' | 'airworthiness' | 'noise' | 'station'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'license_front') {
    // Flight License Front (plastic card aesthetic with photo & watermark)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 500);

    // Subtle guilloche / security pattern
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 20) {
      ctx.beginPath();
      ctx.arc(400, 250, i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Top Blue Aviation Band
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 800, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('AGENCIA FEDERAL DE AVIACIÓN CIVIL · AFAC MÉXICO', 30, 36);
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText('ICAO ANNEX 1 · LICENCIA DE PILOTO COMERCIAL (CPL)', 30, 60);

    // Pilot Photo Frame
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(40, 110, 150, 190);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FOTOGRAFÍA', 80, 210);

    // Pilot Data
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('I. TITULAR / PILOT NAME:', 220, 125);
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CAP. ROBERTO MENDOZA VALENZUELA', 220, 150);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('IV. NÚMERO DE LICENCIA / FOLIO:', 220, 190);
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0284c7';
    ctx.fillText('CPL-094812-MX', 220, 218);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('X. FECHA DE EXPEDICIÓN:', 220, 260);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('15 ABRIL 2024', 220, 280);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('XI. VENCIMIENTO DE VERIFICACIÓN / EXPIRY:', 450, 260);
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('28 NOVIEMBRE 2026', 450, 282);

    // Bottom Official Stamp
    ctx.save();
    ctx.translate(680, 390);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.strokeRect(-80, -35, 160, 70);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('AFAC LICENCIAS', -55, -10);
    ctx.fillText('VERIFICADO OACI', -55, 10);
    ctx.fillText('SELLO OFICIAL', -45, 25);
    ctx.restore();

    // Barcode on bottom
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 440, 400, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('|| | |||| ||| ||||| || |||||| |||| ||| | ||||| | | ||||||| CPL94812MX', 50, 460);

  } else if (type === 'license_back') {
    // Flight License Back (Ratings & Endorsements)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('XII. HABILITACIONES VIGENTES (RATINGS & ENDORSEMENTS):', 40, 50);

    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0369a1';
    ctx.fillText('• MONOMOTOR TERRESTRE (SEL) HASTA 5700 KG', 60, 90);
    ctx.fillText('• MULTIMOTOR TERRESTRE (MEP)', 60, 125);
    ctx.fillText('• VUELO POR INSTRUMENTOS (IFR - TODAS LAS AERONAVES)', 60, 160);
    ctx.fillText('• VFR NOCTURNO AUTORIZADO', 60, 195);
    ctx.fillText('• HABILITACIÓN DE TIPO: CESSNA 172S / KING AIR B200', 60, 230);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('XIII. LIMITACIONES / RESTRICTIONS:', 40, 290);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('NINGUNA LIMITACIÓN OPERATIVA. NIVEL DE COMPETENCIA LINGÜÍSTICA OACI 5 (INGLÉS OPERACIONAL).', 60, 320);

    // Signatures
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 420);
    ctx.lineTo(260, 420);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = '11px sans-serif';
    ctx.fillText('FIRMA DEL TITULAR', 100, 440);

    ctx.beginPath();
    ctx.moveTo(480, 420);
    ctx.lineTo(720, 420);
    ctx.stroke();
    ctx.fillText('DIRECTOR DE REGISTRO AERONÁUTICO', 500, 440);

  } else if (type === 'medical') {
    // Medical certificate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, 800, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CONSTANCIA DE APTITUD PSICOFÍSICA AERONÁUTICA', 30, 36);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('CENTRO NACIONAL DE MEDICINA DE AVIACIÓN (CEMA) · CLASE 1', 30, 52);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NOMBRE DEL PILOTO / APPLICANT:', 40, 100);
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('P.A. VALERIA DELGADO RAMÍREZ', 40, 125);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FOLIO DICTAMEN MÉDICO:', 450, 100);
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillStyle = '#047857';
    ctx.fillText('MED-1-MX-80941', 450, 125);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('MÉDICO EXAMINADOR AÉREO AUTORIZADO (AME):', 40, 175);
    ctx.font = '14px sans-serif';
    ctx.fillText('DRA. CLAUDIA LOZANO MORA (AME REGISTRO #608)', 40, 195);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FECHA DE EVALUACIÓN:', 40, 240);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('05 NOVIEMBRE 2025', 40, 260);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('VENCIMIENTO CLASE 1:', 450, 240);
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('05 NOVIEMBRE 2026', 450, 262);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('LIMITACIONES Y DICTAMEN:', 40, 310);
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('• DEBE USAR LENTES CORRECTORES PARA VISIÓN LEJANA (VML) Y PORTAR PAR DE REPUESTO.', 40, 335);

    // Green circular seal
    ctx.save();
    ctx.translate(650, 380);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEDICINA DE AVIACIÓN', 0, -15);
    ctx.fillText('★ APTO CLASE 1 ★', 0, 5);
    ctx.fillText('SECRETARÍA SALUD', 0, 22);
    ctx.restore();

  } else if (type === 'airworthiness') {
    // Airworthiness Certificate
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = '#4338ca';
    ctx.fillRect(0, 0, 800, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CERTIFICADO DE AERONAVEGABILIDAD ESTÁNDAR', 30, 36);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('DIRECCIÓN DE SEGURIDAD AÉREA · NOM-012-SCT3 / FAR PART 21', 30, 52);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('MATRÍCULA DE LA AERONAVE (REGISTRATION):', 40, 100);
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4338ca';
    ctx.fillText('XB-CAP', 40, 130);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FABRICANTE Y MODELO (AIRCRAFT):', 250, 100);
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CESSNA 172S SKYHAWK SP', 250, 130);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NÚMERO DE SERIE (S/N):', 580, 100);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('172S-10942', 580, 130);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NÚMERO DE CERTIFICADO DE AERONAVEGABILIDAD:', 40, 180);
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText('CA-MX-2023-0881', 40, 205);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FECHA DE EMISIÓN:', 40, 250);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('10 MARZO 2023', 40, 270);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('PRÓXIMA INSPECCIÓN ANUAL / REVALIDACIÓN:', 420, 250);
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('12 NOVIEMBRE 2026', 420, 272);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TALLER AERONÁUTICO / INSPECTOR AUTORIZADO:', 40, 320);
    ctx.font = '14px sans-serif';
    ctx.fillText('TALLER AERONÁUTICO APROBADO TAA-120 (ING. CARLOS RENDÓN)', 40, 342);

    // Stamp
    ctx.save();
    ctx.translate(650, 390);
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-70, -30, 140, 60);
    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AERONAVEGABILIDAD', 0, -10);
    ctx.fillText('LIBERADO PARA VUELO', 0, 8);
    ctx.fillText('AFAC MÉXICO', 0, 22);
    ctx.restore();

  } else if (type === 'noise') {
    // Noise Certificate (Certificado de Ruido - OACI Anexo 16 / FAR Part 36)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 800, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CERTIFICADO DE HOMOLOGACIÓN ACÚSTICA DE AERONAVE (RUIDO)', 30, 36);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('OACI ANEXO 16 VOLUMEN I · CAPÍTULO 4 / FAR PART 36 STAGE 4', 30, 52);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('MATRÍCULA DE LA AERONAVE (REGISTRATION):', 40, 100);
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0284c7';
    ctx.fillText('XB-CAP', 40, 130);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('AERONAVE Y PLANTA MOTRIZ:', 250, 100);
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CESSNA 172S · LYCOMING IO-360-L2A (180 HP)', 250, 130);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FOLIO DEL CERTIFICADO DE RUIDO:', 40, 180);
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText('NOISE-CERT-OACI-2023-741', 40, 205);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('MEDICIÓN DE NIVELES ACÚSTICOS CERTIFICADOS:', 40, 250);
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0369a1';
    ctx.fillText('• SOBREVUELO (FLYOVER): 74.8 EPNdB (LÍMITE MÁX: 85.0 EPNdB)', 50, 280);
    ctx.fillText('• DESPEGUE CON PLENA POTENCIA: 78.1 EPNdB (LÍMITE MÁX: 88.0 EPNdB)', 50, 310);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ESTADO REGULATORIO:', 40, 350);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#166534';
    ctx.fillText('✓ CUMPLE CON LAS NORMAS AMBIENTALES DE EMISIÓN DE RUIDO AERONÁUTICO INTERNACIONAL', 40, 372);

    // Blue acoustic official stamp
    ctx.save();
    ctx.translate(650, 380);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOMOLOGACIÓN', 0, -15);
    ctx.fillText('★ ACÚSTICA ★', 0, 5);
    ctx.fillText('OACI ANEXO 16', 0, 22);
    ctx.restore();

  } else if (type === 'station') {
    // Radio Station License (Certificado de Estación de Radio)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, 800, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LICENCIA DE ESTACIÓN DE RADIOELÉCTRICA DE AERONAVE', 30, 36);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('TELECOMUNICACIONES AERONÁUTICAS Y SEGURIDAD OPERACIONAL · UIT / AFAC', 30, 52);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('MATRÍCULA / DISTINTIVO DE LLAMADA (CALL SIGN):', 40, 100);
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#059669';
    ctx.fillText('XB-CAP (INDICATIVO: XB-CAP)', 40, 130);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FOLIO DE LICENCIA DE ESTACIÓN:', 450, 100);
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText('LIC-EST-RAD-8812', 450, 130);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('EQUIPOS Y BANDAS DE FRECUENCIA AUTORIZADAS:', 40, 180);
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#065f46';
    ctx.fillText('• TRANSCEPTORES VHF COM 1 & COM 2: 118.000 - 136.975 MHz (GARMIN G1000)', 50, 210);
    ctx.fillText('• RECEPTOR VOR / LOC / GLIDESLOPE: 108.000 - 117.950 MHz', 50, 235);
    ctx.fillText('• TRANSPONDEDOR MODO S / ADS-B OUT: 1090 MHz (GARMIN GTX-345R)', 50, 260);
    ctx.fillText('• TRANSMISOR LOCALIZADOR DE EMERGENCIA (ELT): 406.028 MHz & 121.5 MHz', 50, 285);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FECHA DE VENCIMIENTO DE LA LICENCIA DE ESTACIÓN:', 40, 335);
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#059669';
    ctx.fillText('20 OCTUBRE 2027', 40, 360);

    // Green Telecom Seal
    ctx.save();
    ctx.translate(650, 380);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-70, -30, 140, 60);
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TELECOM AERONÁUTICA', 0, -10);
    ctx.fillText('ESTACIÓN AUTORIZADA', 0, 8);
    ctx.fillText('VHF / MODO S / ELT', 0, 22);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

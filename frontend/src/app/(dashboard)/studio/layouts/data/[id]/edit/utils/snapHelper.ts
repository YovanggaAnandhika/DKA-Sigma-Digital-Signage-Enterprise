export interface SnapResult {
  x: number;
  y: number;
  guideX: number | null;
  guideY: number | null;
}

interface CalculateSnapParams {
  currentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  otherLayers: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  threshold?: number;
}

export function calculateSnap({
  currentId,
  x,
  y,
  width,
  height,
  canvasWidth,
  canvasHeight,
  otherLayers,
  threshold = 8,
}: CalculateSnapParams): SnapResult {
  let bestX = x;
  let bestDeltaX = threshold + 1;
  let guideX: number | null = null;

  // X Candidates Checker
  const checkXCandidate = (candidateX: number, targetGuide: number) => {
    const delta = Math.abs(x - candidateX);
    if (delta <= threshold && delta < bestDeltaX) {
      bestDeltaX = delta;
      bestX = candidateX;
      guideX = targetGuide;
    }
  };

  // 1. Canvas X Targets (Left, Center, Right)
  checkXCandidate(0, 0); // Canvas Left
  checkXCandidate(Math.round((canvasWidth - width) / 2), Math.round(canvasWidth / 2)); // Canvas Center
  checkXCandidate(canvasWidth - width, canvasWidth); // Canvas Right

  // 2. Other Layers X Targets
  for (const other of otherLayers) {
    if (other.id === currentId) continue;
    const oX = Number(other.x) || 0;
    const oW = Number(other.width) || 0;

    checkXCandidate(oX, oX); // Left to Left
    checkXCandidate(oX - width, oX); // Right to Left
    checkXCandidate(oX + oW, oX + oW); // Left to Right
    checkXCandidate(oX + oW - width, oX + oW); // Right to Right
    checkXCandidate(Math.round(oX + (oW - width) / 2), Math.round(oX + oW / 2)); // Center to Center
  }

  // Y Candidates Checker
  let bestY = y;
  let bestDeltaY = threshold + 1;
  let guideY: number | null = null;

  const checkYCandidate = (candidateY: number, targetGuide: number) => {
    const delta = Math.abs(y - candidateY);
    if (delta <= threshold && delta < bestDeltaY) {
      bestDeltaY = delta;
      bestY = candidateY;
      guideY = targetGuide;
    }
  };

  // 1. Canvas Y Targets (Top, Middle, Bottom)
  checkYCandidate(0, 0); // Canvas Top
  checkYCandidate(Math.round((canvasHeight - height) / 2), Math.round(canvasHeight / 2)); // Canvas Middle
  checkYCandidate(canvasHeight - height, canvasHeight); // Canvas Bottom

  // 2. Other Layers Y Targets
  for (const other of otherLayers) {
    if (other.id === currentId) continue;
    const oY = Number(other.y) || 0;
    const oH = Number(other.height) || 0;

    checkYCandidate(oY, oY); // Top to Top
    checkYCandidate(oY - height, oY); // Bottom to Top
    checkYCandidate(oY + oH, oY + oH); // Top to Bottom
    checkYCandidate(oY + oH - height, oY + oH); // Bottom to Bottom
    checkYCandidate(Math.round(oY + (oH - height) / 2), Math.round(oY + oH / 2)); // Center to Center
  }

  return {
    x: bestDeltaX <= threshold ? bestX : x,
    y: bestDeltaY <= threshold ? bestY : y,
    guideX: bestDeltaX <= threshold ? guideX : null,
    guideY: bestDeltaY <= threshold ? guideY : null,
  };
}

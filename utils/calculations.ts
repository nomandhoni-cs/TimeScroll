export function calculatePPI(): number {
  const screenDiagonalInches = 13.3;
  const screenWidthPixels = window.screen.width;
  const screenHeightPixels = window.screen.height;

  const diagonalPixels = Math.sqrt(
    Math.pow(screenWidthPixels, 2) + Math.pow(screenHeightPixels, 2)
  );
  return diagonalPixels / screenDiagonalInches;
}

export function pixelsToMeters(pixels: number, ppi: number): number {
  const inchesPerMeter = 39.37;
  return pixels / (ppi * inchesPerMeter);
}

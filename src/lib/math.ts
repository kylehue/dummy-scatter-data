export function clamp(value: number, min: number, max: number) {
   return Math.min(Math.max(value, min), max);
}

export function map(
   value: number,
   inputMin: number,
   inputMax: number,
   outputMin: number,
   outputMax: number,
) {
   const t = (value - inputMin) / (inputMax - inputMin);
   return outputMin + t * (outputMax - outputMin);
}

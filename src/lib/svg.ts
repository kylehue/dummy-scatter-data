export function pointsToSvgPath(
   points: { x: number; y: number }[],
   options: { size?: number; padding?: number } = {},
) {
   if (points.length < 2) return "";
   const size = options.size ?? 48;
   const padding = options.padding ?? 2;

   let minX = points[0].x;
   let maxX = points[0].x;
   let minY = points[0].y;
   let maxY = points[0].y;

   for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
   }

   const drawArea = size - padding * 2;
   const width = Math.max(maxX - minX, 1);
   const height = Math.max(maxY - minY, 1);
   const scale = drawArea / Math.max(width, height);
   const offsetX = (size - width * scale) / 2;
   const offsetY = (size - height * scale) / 2;

   return points
      .map((point, index) => {
         const x = (point.x - minX) * scale + offsetX;
         const y = (point.y - minY) * scale + offsetY;
         return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
}

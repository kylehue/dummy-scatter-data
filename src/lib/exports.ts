export function exportAsCsv(data: Record<string, any[]>, filename: string) {
   const headers = Object.keys(data);
   const columns = headers.map((header) => data[header] ?? []);
   const rowCount = columns.reduce(
      (max, column) => Math.max(max, column.length),
      0,
   );

   function escapeCsvValue(value: unknown): string {
      if (value === null || value === undefined) return "";
      const raw = String(value);
      if (/[",\n]/.test(raw)) {
         return `"${raw.replace(/"/g, '""')}"`;
      }
      return raw;
   }

   const rows: string[] = [];
   rows.push(headers.join(","));

   for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const row = columns.map((column) => escapeCsvValue(column[rowIndex]));
      rows.push(row.join(","));
   }

   const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");

   const encodedUri = encodeURI(csvContent);
   const link = document.createElement("a");
   link.setAttribute("href", encodedUri);
   link.setAttribute("download", filename);
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

export function exportAsJson(data: Record<string, any>, filename: string) {
   const jsonContent =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(data));

   const link = document.createElement("a");
   link.setAttribute("href", jsonContent);
   link.setAttribute("download", filename);
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

export function exportAsPng(canvas: HTMLCanvasElement, filename: string) {
   const pngContent = canvas.toDataURL("image/png");

   const link = document.createElement("a");
   link.setAttribute("href", pngContent);
   link.setAttribute("download", filename);
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

export function exportAsSvg(svg: string, filename: string) {
   const svgContent = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

   const link = document.createElement("a");
   link.setAttribute("href", svgContent);
   link.setAttribute("download", filename);
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

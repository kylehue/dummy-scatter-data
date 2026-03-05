import pako from "pako";

/**
 * Converts a JSON object to a URL-safe compressed string.
 *
 * @param json The JSON object to be converted.
 */
export function jsonToUrl(json: any): string {
   const jsonString: string = JSON.stringify(json);
   const compressed: Uint8Array = pako.deflate(jsonString);
   const base64Compressed: string = btoa(String.fromCharCode(...compressed));
   return encodeURIComponent(base64Compressed);
}

/**
 * Converts a URL-safe compressed string back to a JSON object.
 *
 * @param urlSafeString The URL-safe compressed string to be converted.
 */
export function urlToJson(urlSafeString: string) {
   const decodedBase64: string = decodeURIComponent(urlSafeString);
   const binaryCompressed: Uint8Array = Uint8Array.from(
      atob(decodedBase64),
      (char) => char.charCodeAt(0),
   );
   const decompressed: string = pako.inflate(binaryCompressed, {
      to: "string",
   });
   return JSON.parse(decompressed);
}

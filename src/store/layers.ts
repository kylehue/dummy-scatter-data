import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Layer, Position } from "../lib/types";
import _simplifyPoints from "simplify-js";
import isPointInPolygon from "@turf/boolean-point-in-polygon";
import { clamp } from "@/lib/math";
import { jsonToUrl, urlToJson } from "@/lib/url";

let isAutosaveStatePaused = false;
export const useLayersStore = defineStore("layers", () => {
   const layers = ref(new Map<string, Layer>());
   const activeLayerId = ref<string | null>(null);
   const size = computed(() => layers.value.size);

   function create() {
      const newLayer: Layer = {
         id: Math.random().toString(36).substring(2),
         name: `layer_${size.value + 1}`,
         boundaryPoints: [],
         order: 0,
         isHidden: false,
         isLocked: false,
         dataOptions: {
            size: 1000,
            noise: 0,
            spread: 0,
            inverted: false,
            color: "#ff0000",
            opacity: 0.5,
         },
         data: [],
      };

      for (const layer of layers.value.values()) {
         layer.order += 1;
      }

      activeLayerId.value = newLayer.id;
      layers.value.set(newLayer.id, newLayer);

      saveState();

      return newLayer;
   }

   function get(layerId?: string) {
      const layer = getSafe(layerId);
      if (!layer) throw new Error(`Layer with id ${layerId} not found`);
      return layer;
   }

   function getSafe(layerId?: string) {
      const layer = layerId
         ? layers.value.get(layerId)
         : layers.value.get(activeLayerId.value!);
      return layer;
   }

   function addBoundaryPoint(
      point: { x: number; y: number },
      layerId?: string,
   ) {
      const layer = get(layerId);
      layer.boundaryPoints.push({ ...point });
   }

   function getAll() {
      return Array.from(layers.value.values());
   }

   function setActive(layerId: string) {
      const layer = get(layerId);
      activeLayerId.value = layer.id;
   }

   function remove(layerId?: string) {
      const layer = get(layerId);
      layers.value.delete(layer.id);
      if (activeLayerId.value === layer.id) {
         activeLayerId.value = layers.value.size
            ? Array.from(layers.value.keys())[0]
            : null;
      }

      saveState();
   }

   function getBoundaryPoints(layerId?: string) {
      const layer = get(layerId);
      return layer.boundaryPoints;
   }

   function setBoundaryPoints(
      points: { x: number; y: number }[],
      layerId?: string,
   ) {
      const layer = get(layerId);
      layer.boundaryPoints = points;

      saveState();
   }

   function simplifyBoundaryPoints(layerId?: string) {
      const layer = get(layerId);
      const simplifiedPoints = _simplifyPoints(layer.boundaryPoints, 3);
      layer.boundaryPoints = simplifiedPoints;
   }

   function duplicate(layerId?: string) {
      const layer = get(layerId);
      const newLayer = create();
      newLayer.boundaryPoints = layer.boundaryPoints.map((point) => ({
         ...point,
      }));
      newLayer.name = `${layer.name} (copy)`;
      newLayer.dataOptions = { ...layer.dataOptions };
      newLayer.data = layer.data.map((point) => ({ ...point }));
      setOrder(layer.order, newLayer.id);

      saveState();

      return newLayer;
   }

   function setOrder(newOrder: number, layerId?: string) {
      const layer = get(layerId);
      const oldOrder = layer.order;
      const targetOrder = clamp(newOrder, 0, layers.value.size - 1);
      if (targetOrder === oldOrder) return;

      for (const currentLayer of layers.value.values()) {
         if (currentLayer.id === layer.id) continue;

         if (targetOrder > oldOrder) {
            if (
               currentLayer.order > oldOrder &&
               currentLayer.order <= targetOrder
            ) {
               currentLayer.order -= 1;
            }
            continue;
         }

         if (
            currentLayer.order >= targetOrder &&
            currentLayer.order < oldOrder
         ) {
            currentLayer.order += 1;
         }
      }

      saveState();

      layer.order = targetOrder;
   }

   function setName(newName: string, layerId?: string) {
      const layer = get(layerId);
      layer.name = newName || layer.id;

      saveState();
   }

   function setHidden(hidden: boolean, layerId?: string) {
      const layer = get(layerId);
      layer.isHidden = hidden;

      saveState();
   }

   function setLocked(locked: boolean, layerId?: string) {
      const layer = get(layerId);
      layer.isLocked = locked;

      saveState();
   }

   function setDataOptions(
      options: Partial<Layer["dataOptions"]>,
      layerId?: string,
   ) {
      const layer = get(layerId);
      layer.dataOptions = { ...layer.dataOptions, ...options };

      saveState();
   }

   function generateData(layerId?: string) {
      const layer = get(layerId);
      const { size, spread, noise, inverted } = layer.dataOptions;
      const boundary = layer.boundaryPoints;

      const targetSize = Math.max(0, Math.floor(size));
      if (targetSize === 0 || boundary.length < 3) {
         layer.data = [];
         return layer.data;
      }

      const boundaryMax = boundary.reduce(
         (max, point) => Math.max(max, point.x, point.y),
         0,
      );
      const isPixelBoundary = boundaryMax > 1.5;
      const unitBoundary = isPixelBoundary
         ? boundary.map((point) => ({ x: point.x / 500, y: point.y / 500 }))
         : boundary;

      const ring: Array<[number, number]> = unitBoundary.map((point) => [
         point.x,
         point.y,
      ]);
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
         ring.push([first[0], first[1]]);
      }

      const polygon = {
         type: "Polygon" as const,
         coordinates: [ring],
      };

      const isInsideBoundary = (point: Position) =>
         isPointInPolygon([point.x, point.y], polygon);

      const noiseCount = clamp(noise * targetSize, 0, targetSize);
      const coreCount = targetSize - noiseCount;
      const sigma = Math.max(spread, 0) / 4;

      const targetPredicate = inverted
         ? (point: Position) => !isInsideBoundary(point)
         : (point: Position) => isInsideBoundary(point);

      function randomNormal(): number {
         let u = 0;
         let v = 0;
         while (u === 0) u = Math.random();
         while (v === 0) v = Math.random();
         return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }

      function sampleRandomUnit(): Position {
         return {
            x: Math.random(),
            y: Math.random(),
         };
      }

      function sampleFromTarget(maxAttempts = 100): Position | null {
         for (let i = 0; i < maxAttempts; i++) {
            const candidate = sampleRandomUnit();
            if (targetPredicate(candidate)) {
               return candidate;
            }
         }

         return null;
      }

      const generated: Position[] = [];

      // main data
      for (let i = 0; i < coreCount; i++) {
         const base = sampleFromTarget() ?? sampleRandomUnit();

         if (sigma <= 0) {
            generated.push(base);
            continue;
         }

         generated.push({
            x: base.x + randomNormal() * sigma,
            y: base.y + randomNormal() * sigma,
         });
      }

      // noise data
      for (let i = 0; i < noiseCount; i++) {
         generated.push(sampleRandomUnit());
      }

      layer.data = generated;
      return layer.data;
   }

   function clear() {
      layers.value.clear();
      activeLayerId.value = null;
   }

   function toJson() {
      return JSON.stringify({
         layers: getAll().map((layer) => ({
            ...layer,
            data: [],
         })),
         activeLayerId: activeLayerId.value,
      });
   }

   function fromJson(json: string) {
      const parsed = JSON.parse(json);
      layers.value = new Map(
         parsed.layers.map((layer: Layer) => [layer.id, layer]),
      );
      activeLayerId.value = parsed.activeLayerId;

      // regenerate data
      for (const layer of layers.value.values()) {
         generateData(layer.id);
      }
   }

   const STATE_LIMIT = 100;
   const stateStack = ref<any[]>([]);
   let currentStateIndex = -1;
   function saveState() {
      if (isAutosaveStatePaused) {
         isAutosaveStatePaused = false;
         return;
      }

      const state = toJson();
      stateStack.value.length = currentStateIndex + 1; // discard redo states
      stateStack.value.push(state);
      if (stateStack.value.length > STATE_LIMIT) {
         stateStack.value.shift();
      }
      currentStateIndex = stateStack.value.length - 1;

      updateUrlState();
      console.log("save state");
   }

   function moveState(delta: number) {
      let newIndex = clamp(
         currentStateIndex + delta,
         -1,
         stateStack.value.length - 1,
      );
      if (newIndex === -1) {
         currentStateIndex = -1;
         clear(); // reset to empty state
      } else if (newIndex !== currentStateIndex) {
         currentStateIndex = newIndex;
         const state = stateStack.value[currentStateIndex];
         fromJson(state);
      }
   }

   function pauseAutosaveState() {
      isAutosaveStatePaused = true;
   }

   function updateUrlState() {
      // get query
      const query = window.location.search;

      // parse query to object
      const params = new URLSearchParams(query);

      // edit state param
      params.set("state", jsonToUrl(toJson()));

      // update url
      const newUrl =
         window.location.pathname +
         "?" +
         params.toString() +
         window.location.hash;
      window.history.replaceState(null, "", newUrl);
   }

   function loadUrlState() {
      const params = new URLSearchParams(window.location.search);
      const stateParam = params.get("state");
      if (stateParam) {
         const json = urlToJson(stateParam);
         fromJson(json);
      }
   }

   return {
      create,
      get,
      getSafe,
      addBoundaryPoint,
      getAll,
      setActive,
      remove,
      size,
      getBoundaryPoints,
      setBoundaryPoints,
      simplifyBoundaryPoints,
      duplicate,
      setOrder,
      setName,
      setHidden,
      setLocked,
      generateData,
      toJson,
      fromJson,
      saveState,
      moveState,
      setDataOptions,
      pauseAutosaveState,
      updateUrlState,
      loadUrlState,
   };
});

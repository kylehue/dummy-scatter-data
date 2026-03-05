<template>
   <div class="flex min-h-dvh w-full justify-center overflow-y-auto p-3 sm:p-4">
      <div class="container flex w-full flex-col gap-3 sm:gap-4">
         <Menu />
         <div class="flex w-full flex-wrap justify-center gap-3">
            <Layers
               class="order-2 xl:order-1 flex-1 min-w-75"
               :style="{ height: CANVAS_SIZE + 'px' }"
               @update:layer="onUpdateLayer()"
            />
            <div class="order-1 xl:order-2 flex-none">
               <div
                  class="flex justify-center xl:items-center"
                  :style="{ height: CANVAS_SIZE + 'px' }"
               >
                  <div
                     ref="canvasWrapper"
                     class="relative flex-none overflow-hidden rounded-xl bg-white"
                     :style="{
                        height: CANVAS_SIZE + 'px',
                        width: CANVAS_SIZE + 'px',
                     }"
                  >
                     <canvas
                        ref="dataCanvas"
                        :width="CANVAS_SIZE"
                        :height="CANVAS_SIZE"
                        class="absolute top-0 left-0"
                     ></canvas>
                     <canvas
                        ref="boundaryCanvas"
                        :width="CANVAS_SIZE"
                        :height="CANVAS_SIZE"
                        class="absolute top-0 left-0"
                     ></canvas>
                  </div>
               </div>
            </div>

            <LayerConfig
               class="order-3 flex-1 min-w-75"
               :style="{ height: CANVAS_SIZE + 'px' }"
               @update:data-options="onUpdateLayerData()"
            />
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, useTemplateRef, watch } from "vue";
import { useMouse } from "@/composables/use-mouse";
import { useLayersStore } from "@/store/layers";
import { clamp } from "@/lib/math";
import Layers from "./Layers.vue";
import LayerConfig from "./LayerConfig.vue";
import Menu from "./Menu.vue";
import { useSettingsStore } from "@/store/settings";
import { useShortcuts } from "@/composables/use-shortcuts";

const CANVAS_SIZE = 500;

const dataCanvas = useTemplateRef("dataCanvas");
const boundaryCanvas = useTemplateRef("boundaryCanvas");
const canvasWrapper = useTemplateRef("canvasWrapper");
const mouse = useMouse({
   mouseDownTarget: canvasWrapper,
   mouseMoveTarget: canvasWrapper,
});
const shortcuts = useShortcuts();
const layers = useLayersStore();
const settings = useSettingsStore();
const sortedLayers = computed(() => {
   const all = layers.getAll();
   return all.slice().sort((a, b) => a.order - b.order);
});

const isDrawing = ref(false);
const dataCtx = computed(() => dataCanvas.value?.getContext("2d"));
const boundaryCtx = computed(() => boundaryCanvas.value?.getContext("2d"));

function redrawData() {
   if (!dataCtx.value) return;
   dataCtx.value.clearRect(
      0,
      0,
      dataCtx.value.canvas.width,
      dataCtx.value.canvas.height,
   );
   if (!settings.isDataPointsVisible) return;
   for (const layer of sortedLayers.value) {
      if (!layer.data.length) continue;
      if (layer.isHidden) continue;
      for (let i = 0; i < layer.data.length; i++) {
         const point = layer.data[i];
         dataCtx.value.globalAlpha = layer.dataOptions.opacity ?? 1;
         dataCtx.value.beginPath();
         dataCtx.value.arc(
            point.x * CANVAS_SIZE,
            point.y * CANVAS_SIZE,
            2,
            0,
            Math.PI * 2,
         );
         dataCtx.value.fillStyle = layer.dataOptions.color;
         dataCtx.value.fill();
         dataCtx.value.closePath();
         dataCtx.value.globalAlpha = 1;
      }
   }
}

function redrawBoundary() {
   if (!boundaryCtx.value) return;
   boundaryCtx.value.clearRect(
      0,
      0,
      boundaryCtx.value.canvas.width,
      boundaryCtx.value.canvas.height,
   );
   if (!settings.isBoundaryVisible) return;
   for (const layer of sortedLayers.value) {
      if (!layer.boundaryPoints.length) continue;
      if (layer.isHidden) continue;
      boundaryCtx.value.beginPath();
      boundaryCtx.value.moveTo(
         layer.boundaryPoints[0].x,
         layer.boundaryPoints[0].y,
      );
      for (let i = 1; i < layer.boundaryPoints.length; i++) {
         const point = layer.boundaryPoints[i];
         boundaryCtx.value.lineTo(point.x, point.y);
      }
      boundaryCtx.value.strokeStyle = layer.dataOptions.color;
      boundaryCtx.value.lineWidth = 1;
      boundaryCtx.value.stroke();
   }
}

function onBeforeDraw() {
   console.log("before draw");
   layers.pauseAutosaveState();
   layers.setBoundaryPoints([]); // overwrite
}

function onAfterDraw() {
   console.log("after draw");
   const points = layers.getBoundaryPoints();
   if (points.length > 0) {
      layers.addBoundaryPoint(points[0]); // close
      layers.simplifyBoundaryPoints();
      layers.generateData();
   }
   redrawBoundary();
   redrawData();
   layers.saveState();
}

function onUpdateLayerData() {
   console.log("data options changed");
   layers.generateData();
   redrawData();
   redrawBoundary();
}

function onUpdateLayer() {
   console.log("layer changed");
   redrawData();
   redrawBoundary();
}

function onDraw() {
   console.log("during draw");
   const clamped = {
      x: clamp(mouse.x, 0, CANVAS_SIZE),
      y: clamp(mouse.y, 0, CANVAS_SIZE),
   };
   layers.addBoundaryPoint(clamped);
   redrawBoundary();
}

function onUndo() {
   console.log("undo");
   layers.moveState(-1);
   redrawBoundary();
   redrawData();
}

function onRedo() {
   console.log("redo");
   layers.moveState(1);
   redrawBoundary();
   redrawData();
}

shortcuts.register("ctrl+z", (e) => {
   e.preventDefault();
   onUndo();
});

shortcuts.register("ctrl+shift+z", (e) => {
   e.preventDefault();
   onRedo();
});

shortcuts.register("ctrl+y", (e) => {
   e.preventDefault();
   onRedo();
});

watch(
   () => [mouse.isDown, mouse.x, mouse.y],
   () => {
      if (!mouse.isDown) return;
      if (!layers.size) return;
      if (layers.get().isHidden) return;
      if (layers.get().isLocked) return;
      if (!isDrawing.value) onBeforeDraw();
      isDrawing.value = true;
      onDraw();
   },
);
watch(
   () => [mouse.isDown],
   () => {
      if (mouse.isDown) return;
      if (!layers.size) return;
      if (!isDrawing.value) return;
      if (layers.get().isHidden) return;
      if (layers.get().isLocked) return;
      onAfterDraw();
      isDrawing.value = false;
   },
);
watch(
   () => [settings.isBoundaryVisible, settings.isDataPointsVisible],
   () => {
      redrawBoundary();
      redrawData();
   },
);

onMounted(() => {
   (window as any).layers = layers; // for debugging
   layers.loadUrlState();
   redrawData();
   redrawBoundary();
});
</script>

<style scoped></style>

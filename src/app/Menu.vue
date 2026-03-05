<template>
   <Menubar>
      <MenubarMenu>
         <MenubarTrigger>File</MenubarTrigger>
         <MenubarContent>
            <MenubarSub>
               <MenubarSubTrigger>Export as</MenubarSubTrigger>
               <MenubarSubContent>
                  <MenubarItem @click="exportAsCsv()">CSV</MenubarItem>
                  <MenubarItem @click="exportAsJson()">JSON</MenubarItem>
                  <MenubarItem @click="exportAsPng()">PNG</MenubarItem>
                  <MenubarItem @click="exportAsSvg()">SVG</MenubarItem>
               </MenubarSubContent>
            </MenubarSub>
         </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
         <MenubarTrigger>Edit</MenubarTrigger>
         <MenubarContent>
            <MenubarItem @click="layers.moveState(-1)">
               Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem @click="layers.moveState(1)">
               Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
         </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
         <MenubarTrigger>View</MenubarTrigger>
         <MenubarContent>
            <MenubarCheckboxItem
               :model-value="settings.isBoundaryVisible"
               @update:model-value="settings.setBoundaryVisibility"
            >
               Show Boundary
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
               :model-value="settings.isDataPointsVisible"
               @update:model-value="settings.setDataPointsVisibility"
            >
               Show Data Points
            </MenubarCheckboxItem>
         </MenubarContent>
      </MenubarMenu>
   </Menubar>
</template>
<script setup lang="ts">
import {
   Menubar,
   MenubarCheckboxItem,
   MenubarContent,
   MenubarItem,
   MenubarMenu,
   MenubarShortcut,
   MenubarSub,
   MenubarSubContent,
   MenubarSubTrigger,
   MenubarTrigger,
} from "@/components/ui/menubar";
import { useLayersStore } from "@/store/layers";
import { useSettingsStore } from "@/store/settings";
import {
   exportAsCsv as _exportAsCsv,
   exportAsJson as _exportAsJson,
   exportAsPng as _exportAsPng,
   exportAsSvg as _exportAsSvg,
} from "@/lib/exports";
import { map } from "@/lib/math";

const settings = useSettingsStore();
const layers = useLayersStore();

function getLayerData() {
   const layerData: Record<string, any[]> = {};
   for (const layer of layers.getAll()) {
      layerData[`${layer.name}_x`] = [];
      layerData[`${layer.name}_y`] = [];
      for (const point of layer.data) {
         layerData[`${layer.name}_x`].push(point.x);
         layerData[`${layer.name}_y`].push(point.y);
      }
   }
   return layerData;
}

function exportAsCsv() {
   _exportAsCsv(getLayerData(), "data.csv");
}

function exportAsJson() {
   _exportAsJson(getLayerData(), "data.json");
}

function exportAsPng() {
   const canvas = document.createElement("canvas");
   const ctx = canvas.getContext("2d")!;
   const size = 1000;
   const radius = map(size, 0, 1000, 1, 5);
   canvas.width = size;
   canvas.height = size;
   ctx.fillStyle = "white";
   ctx.fillRect(0, 0, size, size);
   for (const layer of layers.getAll()) {
      if (layer.isHidden) continue;
      ctx.fillStyle = layer.dataOptions.color;
      ctx.globalAlpha = layer.dataOptions.opacity ?? 1;
      for (const point of layer.data) {
         ctx.beginPath();
         ctx.arc(point.x * size, point.y * size, radius, 0, Math.PI * 2);
         ctx.fill();
      }
   }
   _exportAsPng(canvas, "data.png");
}

function exportAsSvg() {
   const size = 1000;
   const radius = map(size, 0, 1000, 1, 5);
   let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
   svg += `<rect width="100%" height="100%" fill="white"/>`;
   for (const layer of layers.getAll()) {
      if (layer.isHidden) continue;
      const color = layer.dataOptions.color || "black";
      const opacity = layer.dataOptions.opacity ?? 1;
      for (const point of layer.data) {
         svg += `<circle cx="${point.x * size}" cy="${point.y * size}" r="${radius}" fill="${color}" fill-opacity="${opacity}"/>`;
      }
   }
   svg += `</svg>`;
   _exportAsSvg(svg, "data.svg");
}
</script>

<template>
   <Card class="flex flex-col" v-bind="$attrs">
      <CardHeader>
         <CardTitle class="flex items-center gap-3">
            <SettingsIcon />
            <span>{{ layer?.name ?? "No Layer Selected" }}</span>
         </CardTitle>
      </CardHeader>
      <CardContent class="flex-1 min-h-0">
         <Empty v-if="!layer">
            <EmptyHeader>
               <EmptyMedia variant="icon">
                  <SettingsIcon />
               </EmptyMedia>
            </EmptyHeader>
            <EmptyTitle>No layer selected</EmptyTitle>
            <EmptyDescription>
               Please select a layer to view its configuration
            </EmptyDescription>
         </Empty>
         <ScrollArea v-else ref="scrollArea" class="h-full">
            <ItemGroup class="w-100">
               <Item size="sm">
                  <ItemContent class="flex flex-col items-start gap-0">
                     <ItemTitle>Data Size</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                     <NumberField
                        v-model="state.size"
                        :default-value="layer.dataOptions.size"
                        :min="0"
                        :step="1000"
                     >
                        <NumberFieldContent>
                           <NumberFieldDecrement />
                           <NumberFieldInput />
                           <NumberFieldIncrement />
                        </NumberFieldContent>
                     </NumberField>
                  </ItemActions>
                  <ItemFooter>
                     <ItemDescription class="text-xs">
                        The number of data points in the layer.
                     </ItemDescription>
                  </ItemFooter>
               </Item>
               <ItemSeparator />
               <Item size="sm">
                  <ItemContent class="flex flex-col items-start gap-0">
                     <ItemTitle>Data Spread</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                     <Slider
                        v-model="state.spread"
                        :default-value="[layer.dataOptions.spread]"
                        :min="0"
                        :max="1"
                        :step="0.001"
                        class="w-50"
                     />
                  </ItemActions>
                  <ItemFooter>
                     <ItemDescription class="text-xs">
                        How spread out the data points are. Higher spread means
                        more points that break away from the boundary.
                     </ItemDescription>
                  </ItemFooter>
               </Item>
               <ItemSeparator />
               <Item size="sm">
                  <ItemContent class="flex flex-col items-start gap-0">
                     <ItemTitle>Data Noise</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                     <Slider
                        v-model="state.noise"
                        :default-value="[layer.dataOptions.noise]"
                        :min="0"
                        :max="1"
                        :step="0.001"
                        class="w-50"
                     />
                  </ItemActions>
                  <ItemFooter>
                     <ItemDescription class="text-xs">
                        The amount of noise in the data. Higher noise means more
                        random points outside the boundary.
                     </ItemDescription>
                  </ItemFooter>
               </Item>
               <ItemSeparator />
               <Item size="sm">
                  <ItemContent class="flex flex-col items-start gap-0">
                     <ItemTitle>Invert Data</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                     <Switch
                        v-model="state.inverted"
                        :default-checked="layer.dataOptions.inverted"
                     />
                  </ItemActions>
                  <ItemFooter>
                     <ItemDescription class="text-xs">
                        Invert the data points within the boundary.
                     </ItemDescription>
                  </ItemFooter>
               </Item>
               <ItemSeparator />
               <Item size="sm">
                  <ItemContent class="flex flex-col items-start gap-0">
                     <ItemTitle>Opacity</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                     <Slider
                        v-model="state.opacity"
                        :default-value="[layer.dataOptions.opacity]"
                        :min="0"
                        :max="1"
                        :step="0.001"
                        class="w-50"
                     />
                  </ItemActions>
                  <ItemFooter>
                     <ItemDescription class="text-xs">
                        The opacity of the data points.
                     </ItemDescription>
                  </ItemFooter>
               </Item>
               <ItemSeparator />
               <Item size="sm">
                  <ItemContent class="flex flex-col items-start gap-0">
                     <ItemTitle>Color</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                     <input
                        v-model="state.color"
                        type="color"
                        class="p-0! bg-transparent! border-none! cursor-pointer! w-8 h-8"
                     />
                  </ItemActions>
                  <ItemFooter>
                     <ItemDescription class="text-xs">
                        The color of the data points.
                     </ItemDescription>
                  </ItemFooter>
               </Item>
            </ItemGroup>
         </ScrollArea>
      </CardContent>
      <CardFooter v-if="layer" class="flex items-center justify-end">
         <Button @click="save()" :disabled="!isLayerModified">Save</Button>
      </CardFooter>
   </Card>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useLayersStore } from "@/store/layers";
import { useFramesStore } from "@/store/frames";
import { SettingsIcon } from "lucide-vue-next";
import {
   Card,
   CardContent,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import {
   Item,
   ItemDescription,
   ItemFooter,
   ItemGroup,
   ItemTitle,
   ItemSeparator,
   ItemActions,
} from "@/components/ui/item";
import ItemContent from "@/components/ui/item/ItemContent.vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
   NumberField,
   NumberFieldContent,
   NumberFieldDecrement,
   NumberFieldIncrement,
   NumberFieldInput,
} from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@/components/ui/empty";

const layers = useLayersStore();
const frames = useFramesStore();

const layer = computed(() => layers.getSafe());
const isLayerModified = computed(() => {
   if (!layer.value) return false;
   const options = layer.value.dataOptions;
   return (
      options.size !== state.size ||
      options.noise !== state.noise[0] ||
      options.spread !== state.spread[0] ||
      options.inverted !== state.inverted ||
      options.opacity !== state.opacity[0] ||
      options.color !== state.color
   );
});

const state = reactive({
   size: 0,
   noise: [0],
   spread: [0],
   inverted: false,
   opacity: [0],
   color: "#000000",
});

function save() {
   if (!layer.value) return;
   layers.setDataOptions({
      size: state.size,
      noise: state.noise[0],
      spread: state.spread[0],
      inverted: state.inverted,
      opacity: state.opacity[0],
      color: state.color,
   });
   layers.generateData();
   frames.incrementDataFrames();
}

watch(
   layer,
   (layer) => {
      if (!layer) return;
      state.size = layer.dataOptions.size;
      state.noise = [layer.dataOptions.noise];
      state.spread = [layer.dataOptions.spread];
      state.inverted = layer.dataOptions.inverted;
      state.opacity = [layer.dataOptions.opacity];
      state.color = layer.dataOptions.color;
   },
   { immediate: true },
);
</script>

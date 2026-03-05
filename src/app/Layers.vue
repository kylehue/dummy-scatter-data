<template>
   <Card class="flex flex-col" v-bind="$attrs">
      <CardHeader class="flex items-center justify-between">
         <CardTitle class="flex items-center gap-3">
            <LayersIcon />
            Layers
         </CardTitle>
         <CardAction>
            <IconButton
               @click="addLayer()"
               tooltip="Add layer"
               variant="secondary"
            >
               <PlusIcon></PlusIcon>
            </IconButton>
         </CardAction>
      </CardHeader>
      <CardContent class="flex-1 min-h-0">
         <Empty v-if="sortedLayers.length === 0" class="w-full">
            <EmptyHeader>
               <EmptyMedia variant="icon">
                  <LayersIcon />
               </EmptyMedia>
            </EmptyHeader>
            <EmptyTitle>No layers created</EmptyTitle>
            <EmptyDescription>
               Please add a layer to get started
            </EmptyDescription>
            <EmptyContent>
               <Button @click="addLayer()">Add Layer</Button>
            </EmptyContent>
         </Empty>
         <ScrollArea v-else ref="scrollArea" class="h-full">
            <ItemGroup>
               <Draggable
                  :list="sortedLayers"
                  item-key="id"
                  animation="200"
                  @change="
                     (e: any) =>
                        setLayerOrder(e.moved.newIndex, e.moved.element.id)
                  "
               >
                  <template #item="{ element: layer }: { element: Layer }">
                     <Item
                        size="sm"
                        :variant="
                           layers.get().id === layer.id ? 'muted' : 'default'
                        "
                        @click="layers.setActive(layer.id)"
                        class="min-w-72"
                        :class="{
                           'opacity-60': layer.isHidden || layer.isLocked,
                        }"
                     >
                        <ItemMedia>
                           <svg
                              class="shrink-0 rounded-xs border border-border bg-white"
                              :viewBox="`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`"
                              :width="PREVIEW_SIZE"
                              :height="PREVIEW_SIZE"
                              aria-hidden="true"
                           >
                              <path
                                 v-if="layer.boundaryPoints.length > 1"
                                 :d="
                                    pointsToSvgPath(layer.boundaryPoints, {
                                       size: PREVIEW_SIZE,
                                       padding: PREVIEW_PADDING,
                                    })
                                 "
                                 fill="none"
                                 stroke="black"
                                 stroke-width="1"
                                 stroke-linecap="round"
                                 stroke-linejoin="round"
                              />
                           </svg>
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle class="cursor-default">
                              {{ layer.name }}
                           </ItemTitle>
                        </ItemContent>
                        <ItemActions class="flex items-center gap-0">
                           <IconButton
                              @click="toggleLayerHidden(layer.id)"
                              variant="ghost"
                           >
                              <EyeIcon v-if="!layer.isHidden" />
                              <EyeOffIcon v-else />
                           </IconButton>
                           <IconButton
                              @click="toggleLayerLock(layer.id)"
                              variant="ghost"
                           >
                              <LockOpenIcon v-if="!layer.isLocked" />
                              <LockIcon v-else />
                           </IconButton>
                           <DropdownMenu>
                              <DropdownMenuTrigger>
                                 <IconButton variant="ghost">
                                    <EllipsisVerticalIcon></EllipsisVerticalIcon>
                                 </IconButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                 <DropdownMenuItem
                                    @click="
                                       () => {
                                          layerRenameState.layer = layer;
                                          layerRenameState.newName = layer.name;
                                       }
                                    "
                                 >
                                    Rename
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    @click="duplicateLayer(layer.id)"
                                 >
                                    Duplicate
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    variant="destructive"
                                    @click="removeLayer(layer.id)"
                                 >
                                    Delete
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </ItemActions>
                     </Item>
                  </template>
               </Draggable>
            </ItemGroup>
         </ScrollArea>
      </CardContent>
   </Card>
   <Dialog
      :open="!!layerRenameState.layer"
      @update:open="
         (v) => {
            if (!v) layerRenameState.layer = undefined;
         }
      "
   >
      <DialogContent v-if="layerRenameState.layer">
         <DialogHeader>
            <DialogTitle>Rename {{ layerRenameState.layer.name }}</DialogTitle>
         </DialogHeader>
         <Input v-model="layerRenameState.newName" />
         <DialogFooter>
            <DialogClose as-child>
               <Button variant="outline"> Cancel </Button>
            </DialogClose>
            <Button
               @click="
                  () => {
                     if (!layerRenameState.layer) return;
                     layers.setName(
                        layerRenameState.newName,
                        layerRenameState.layer.id,
                     );
                     layerRenameState.layer = undefined;
                  }
               "
            >
               Save changes
            </Button>
         </DialogFooter>
      </DialogContent>
   </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useLayersStore } from "@/store/layers";
import { useFramesStore } from "@/store/frames";
import {
   EllipsisVerticalIcon,
   EyeIcon,
   EyeOffIcon,
   LayersIcon,
   LockIcon,
   LockOpenIcon,
   PlusIcon,
} from "lucide-vue-next";
import {
   Card,
   CardAction,
   CardContent,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import {
   Item,
   ItemActions,
   ItemGroup,
   ItemTitle,
   ItemMedia,
} from "@/components/ui/item";
import ItemContent from "@/components/ui/item/ItemContent.vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
   DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { pointsToSvgPath } from "@/lib/svg";
import IconButton from "@/components/ui/button/IconButton.vue";
import Draggable from "vuedraggable";
import { Layer } from "@/lib/types";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@/components/ui/empty";

const PREVIEW_SIZE = 42;
const PREVIEW_PADDING = 2;

const layers = useLayersStore();
const frames = useFramesStore();
const sortedLayers = computed(() => {
   const all = layers.getAll();
   return all.slice().sort((a, b) => a.order - b.order);
});

const layerRenameState = reactive({
   layer: undefined as Layer | undefined,
   newName: "",
});

function addLayer() {
   layers.create();
}

function removeLayer(id: string) {
   layers.remove(id);
   frames.incrementBoundaryFrames();
   frames.incrementDataFrames();
}

function duplicateLayer(id: string) {
   layers.duplicate(id);
   frames.incrementBoundaryFrames();
   frames.incrementDataFrames();
}

function toggleLayerLock(id: string) {
   const layer = layers.get(id);
   layers.setLocked(!layer.isLocked, layer.id);
   frames.incrementBoundaryFrames();
   frames.incrementDataFrames();
}

function toggleLayerHidden(id: string) {
   const layer = layers.get(id);
   layers.setHidden(!layer.isHidden, layer.id);
   frames.incrementBoundaryFrames();
   frames.incrementDataFrames();
}

function setLayerOrder(newIndex: number, id: string) {
   layers.setOrder(newIndex, id);
   frames.incrementBoundaryFrames();
   frames.incrementDataFrames();
}
</script>

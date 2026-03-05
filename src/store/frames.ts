import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useFramesStore = defineStore("frames", () => {
   const boundaryFramesCounter = ref(0);
   const dataFramesCounter = ref(0);

   function incrementBoundaryFrames() {
      boundaryFramesCounter.value += 1;
   }

   function incrementDataFrames() {
      dataFramesCounter.value += 1;
   }

   return {
      boundaryFramesCounter: computed(() => boundaryFramesCounter.value),
      dataFramesCounter: computed(() => dataFramesCounter.value),
      incrementBoundaryFrames,
      incrementDataFrames,
   };
});

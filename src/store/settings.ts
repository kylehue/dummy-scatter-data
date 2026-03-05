import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
   const isBoundaryVisible = ref(true);
   const isDataPointsVisible = ref(true);

   function setBoundaryVisibility(show: boolean) {
      isBoundaryVisible.value = show;
   }

   function setDataPointsVisibility(show: boolean) {
      isDataPointsVisible.value = show;
   }

   function toJson() {
      return JSON.stringify({
         isBoundaryVisible: isBoundaryVisible.value,
         isDataPointsVisible: isDataPointsVisible.value,
      });
   }

   function fromJson(json: string) {
      const data = JSON.parse(json);
      isBoundaryVisible.value = data.isBoundaryVisible;
      isDataPointsVisible.value = data.isDataPointsVisible;
   }

   return {
      isBoundaryVisible: computed(() => isBoundaryVisible.value),
      isDataPointsVisible: computed(() => isDataPointsVisible.value),
      setBoundaryVisibility,
      setDataPointsVisibility,
      toJson,
      fromJson,
   };
});

import {
   ref,
   onMounted,
   onUnmounted,
   proxyRefs,
   computed,
   Ref,
   watch,
} from "vue";

interface Options {
   mouseDownTarget?: Ref<HTMLElement | Window | null>;
   mouseUpTarget?: Ref<HTMLElement | Window | null>;
   mouseMoveTarget?: Ref<HTMLElement | Window | null>;
}

export function useMouse(options: Options = {}) {
   const x = ref(0);
   const y = ref(0);
   const isDown = ref(false);
   const mouseDownTarget = computed(
      () => options.mouseDownTarget?.value ?? window,
   );
   const mouseUpTarget = computed(() => options.mouseUpTarget?.value ?? window);
   const mouseMoveTarget = computed(
      () => options.mouseMoveTarget?.value ?? window,
   );

   function onMouseMove(event: Event) {
      let typedEvent = event as MouseEvent;
      x.value = typedEvent.offsetX;
      y.value = typedEvent.offsetY;
      // Recover drag state when the pointer re-enters the window while pressed.
      isDown.value = (typedEvent.buttons & 1) === 1;
   }

   function onMouseDown() {
      isDown.value = true;
   }

   function onMouseUp() {
      isDown.value = false;
   }

   function onVisibilityChange() {
      if (document.hidden) {
         isDown.value = false;
      }
   }
   onMounted(() => {
      mouseMoveTarget.value.addEventListener("mousemove", onMouseMove);
      mouseDownTarget.value.addEventListener("mousedown", onMouseDown);
      mouseUpTarget.value.addEventListener("mouseup", onMouseUp);
      document.addEventListener("visibilitychange", onVisibilityChange);
   });

   onUnmounted(() => {
      mouseMoveTarget.value.removeEventListener("mousemove", onMouseMove);
      mouseDownTarget.value.removeEventListener("mousedown", onMouseDown);
      mouseUpTarget.value.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("visibilitychange", onVisibilityChange);
   });

   return proxyRefs({ x, y, isDown });
}

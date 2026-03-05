<template>
   <TooltipProvider>
      <Tooltip>
         <TooltipTrigger as-child>
            <Button size="icon-sm" v-bind="$attrs"><slot /></Button>
         </TooltipTrigger>
         <TooltipContent v-if="props.tooltip">
            {{ props.tooltip }}
         </TooltipContent>
      </Tooltip>
   </TooltipProvider>
</template>

<script setup lang="ts">
import {
   TooltipProvider,
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@/components/ui/tooltip";
import { Button, ButtonVariants } from "@/components/ui/button";

interface Props extends /* @vue-ignore */ ButtonVariants {
   tooltip?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <template v-if="confirming">
    <button
      class="mr-1 rounded px-1.5 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
      @click="emit('confirm-delete')"
    >
      삭제
    </button>
    <button
      class="rounded px-1.5 py-0.5 text-xs font-medium border border-input bg-background hover:bg-accent"
      @click="emit('cancel-delete')"
    >
      취소
    </button>
  </template>
  <template v-else>
    <button
      class="mr-0.5 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      @click="emit('edit')"
    >
      <Pencil class="h-3.5 w-3.5" />
    </button>
    <button
      class="p-1 rounded text-muted-foreground hover:bg-accent hover:text-destructive"
      @click="emit('request-delete')"
    >
      <Trash2 class="h-3.5 w-3.5" />
    </button>
  </template>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from "@lucide/vue";

defineProps<{ confirming: boolean }>();

const emit = defineEmits<{
  edit: [];
  "request-delete": [];
  "confirm-delete": [];
  "cancel-delete": [];
}>();
</script>

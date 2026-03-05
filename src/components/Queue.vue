<script setup lang="ts">
import { ref } from 'vue'
import { useRadio } from '../composables/useRadio'

const { queue, addToQueue, removeFromQueue } = useRadio()

const inputUrl = ref('')

const handleAdd = () => {
  if (inputUrl.value.trim()) {
    addToQueue(inputUrl.value.trim())
    inputUrl.value = ''
  }
}
</script>

<template>
  <div class="bg-surface0 p-6 relative">
    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-lavender"></div>
    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-lavender"></div>
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-lavender"></div>
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-lavender"></div>
    <h2 class="text-xl font-bold mb-4 text-lavender">Queue</h2>
    
    <div class="flex gap-2 mb-4">
      <input 
        v-model="inputUrl"
        @keyup.enter="handleAdd"
        type="text"
        placeholder="YouTube URL"
        class="flex-1 bg-mantle border border-surface1 px-4 py-2 focus:outline-none focus:border-lavender text-text"
      />
      <button 
        @click="handleAdd"
        class="bg-lavender hover:bg-mauve hover:scale-105 px-6 py-2 transition-all text-base font-semibold rounded shadow-lg border-2 border-mauve"
      >
        Add
      </button>
    </div>
    
    <div v-if="queue.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
      <div 
        v-for="(video, index) in queue" 
        :key="video.id + index"
        class="flex items-center gap-3 bg-mantle p-2"
      >
        <img 
          :src="video.thumbnail" 
          :alt="video.title"
          class="w-24 h-14 object-cover"
        />
        <span class="flex-1 truncate">{{ video.title }}</span>
        <button 
          @click="removeFromQueue(index)"
          class="text-subtext hover:text-red p-2"
        >
          ✕
        </button>
      </div>
    </div>
    
    <div v-else class="text-subtext text-center py-4">
      Queue is empty
    </div>
  </div>
</template>

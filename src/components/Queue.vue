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
  <div class="bg-gray-800 rounded-lg p-6">
    <h2 class="text-xl font-bold mb-4">Queue</h2>
    
    <div class="flex gap-2 mb-4">
      <input 
        v-model="inputUrl"
        @keyup.enter="handleAdd"
        type="text"
        placeholder="YouTube URL"
        class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
      />
      <button 
        @click="handleAdd"
        class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
      >
        Add
      </button>
    </div>
    
    <div v-if="queue.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
      <div 
        v-for="(video, index) in queue" 
        :key="video.id + index"
        class="flex items-center gap-3 bg-gray-700 rounded-lg p-2"
      >
        <img 
          :src="video.thumbnail" 
          :alt="video.title"
          class="w-24 h-14 object-cover rounded"
        />
        <span class="flex-1 truncate">{{ video.title }}</span>
        <button 
          @click="removeFromQueue(index)"
          class="text-gray-400 hover:text-red-400 p-2"
        >
          ✕
        </button>
      </div>
    </div>
    
    <div v-else class="text-gray-400 text-center py-4">
      Queue is empty
    </div>
  </div>
</template>

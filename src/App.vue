<script setup lang="ts">
import NowPlaying from './components/NowPlaying.vue'
import Queue from './components/Queue.vue'
import MixPlaylist from './components/MixPlaylist.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 border-b border-gray-700">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-purple-400">PFM Radio</h1>
      </div>
    </header>
    
    <main class="max-w-6xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-6">
          <NowPlaying />
          <Queue />
        </div>
        <div>
          <MixPlaylist />
        </div>
      </div>
    </main>
  </div>
</template>

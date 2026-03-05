<script setup lang="ts">
import { ref } from 'vue'
import { useRadio } from '../composables/useRadio'

const { playlists, addToMix, addPlaylist } = useRadio()

const mixUrl = ref('')
const playlistName = ref('')
const playlistUrl = ref('')

const handleMixSubmit = () => {
  if (mixUrl.value.trim()) {
    addToMix(mixUrl.value.trim())
    mixUrl.value = ''
  }
}

const handlePlaylistSubmit = () => {
  if (playlistName.value.trim() && playlistUrl.value.trim()) {
    addPlaylist(playlistName.value.trim(), playlistUrl.value.trim())
    playlistName.value = ''
    playlistUrl.value = ''
  }
}
</script>

<template>
  <div class="bg-surface0 p-6 space-y-6">
    <div>
      <h2 class="text-xl font-bold mb-4 text-lavender">Submit to Mix</h2>
      <p class="text-subtext text-sm mb-3">Add a YouTube video to the default mix playlist</p>
      <div class="flex gap-2">
        <input 
          v-model="mixUrl"
          @keyup.enter="handleMixSubmit"
          type="text"
          placeholder="YouTube URL"
          class="flex-1 bg-mantle border border-surface1 px-4 py-2 focus:outline-none focus:border-lavender text-text"
        />
        <button 
          @click="handleMixSubmit"
          class="bg-green hover:bg-yellow px-4 py-2 transition text-crust font-medium"
        >
          Add to Mix
        </button>
      </div>
    </div>
    
    <div class="border-t border-surface1 pt-4">
      <h2 class="text-xl font-bold mb-4 text-lavender">Add Playlist</h2>
      <p class="text-subtext text-sm mb-3">Create a new playlist or add videos to an existing one</p>
      <div class="space-y-2">
        <input 
          v-model="playlistName"
          type="text"
          placeholder="Playlist name"
          class="w-full bg-mantle border border-surface1 px-4 py-2 focus:outline-none focus:border-lavender text-text"
        />
        <div class="flex gap-2">
          <input 
            v-model="playlistUrl"
            @keyup.enter="handlePlaylistSubmit"
            type="text"
            placeholder="YouTube URL"
            class="flex-1 bg-mantle border border-surface1 px-4 py-2 focus:outline-none focus:border-lavender text-text"
          />
          <button 
            @click="handlePlaylistSubmit"
            class="bg-blue hover:bg-sky px-4 py-2 transition text-crust font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="playlists.length > 0" class="border-t border-surface1 pt-4">
      <h3 class="font-semibold mb-3 text-text">Available Playlists</h3>
      <div class="space-y-2">
        <div 
          v-for="playlist in playlists" 
          :key="playlist.id"
          class="flex items-center justify-between bg-mantle p-3"
        >
          <span class="text-text">{{ playlist.name }}</span>
          <span class="text-subtext text-sm">{{ playlist.videos.length }} videos</span>
        </div>
      </div>
    </div>
  </div>
</template>

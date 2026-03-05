<script setup lang="ts">
import { ref } from 'vue'
import { useRadio } from '../composables/useRadio'
import { socket } from '../composables/useRadio'

const { playlists, currentPlaylistId, addToMix, addPlaylist, switchPlaylist } = useRadio()

const mixUrl = ref('')
const playlistName = ref('')
const playlistUrl = ref('')
const expandedPlaylist = ref<string | null>(null)

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

const togglePlaylist = (playlistId: string) => {
  expandedPlaylist.value = expandedPlaylist.value === playlistId ? null : playlistId
}

const removeVideo = (playlistId: string, videoIndex: number) => {
  socket.emit('remove-from-playlist', { playlistId, videoIndex })
}

</script>

<template>
  <div class="bg-surface0 p-6 space-y-6 relative">
    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-lavender"></div>
    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-lavender"></div>
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-lavender"></div>
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-lavender"></div>
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
          class="bg-green hover:bg-yellow hover:scale-105 px-6 py-2 transition-all text-crust font-semibold rounded shadow-lg border-2 border-yellow"
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
            class="bg-blue hover:bg-sky hover:scale-105 px-6 py-2 transition-all text-crust font-semibold rounded shadow-lg border-2 border-sky"
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
          class="bg-mantle"
        >
          <div 
            @click="togglePlaylist(playlist.id)"
            class="flex items-center justify-between p-3 cursor-pointer hover:bg-surface0"
          >
            <div class="flex items-center gap-2">
              <span class="text-text">{{ playlist.name }}</span>
              <span v-if="currentPlaylistId === playlist.id" class="text-xs bg-lavender text-base px-2 py-1 rounded">Playing</span>
            </div>
            <div class="flex items-center gap-2">
              <button 
                @click.stop="switchPlaylist(playlist.id)"
                class="bg-blue hover:bg-sky hover:scale-105 px-3 py-1 text-crust font-semibold rounded shadow transition-all border-2 border-sky"
              >
                Play
              </button>
              <span class="text-subtext text-sm">{{ playlist.videos.length }} videos</span>
              <span class="text-lavender">{{ expandedPlaylist === playlist.id ? '▼' : '▶' }}</span>
            </div>
          </div>
          <div v-if="expandedPlaylist === playlist.id" class="px-3 pb-3 space-y-2">
            <div 
              v-for="(video, index) in playlist.videos" 
              :key="video.id + index"
              class="flex items-center gap-3 bg-surface0 p-2"
            >
              <img 
                :src="video.thumbnail" 
                :alt="video.title"
                class="w-24 h-14 object-cover"
              />
              <span class="flex-1 truncate text-sm">{{ video.title }}</span>
              <button 
                @click="removeVideo(playlist.id, index)"
                class="text-subtext hover:text-red p-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

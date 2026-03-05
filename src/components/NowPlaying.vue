<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRadio } from '../composables/useRadio'
import { socket } from '../composables/useRadio'

const { currentVideo, playlists, currentPlaylistId, skip } = useRadio()

const currentPlaylistName = computed(() => {
  const playlist = playlists.value.find(p => p.id === currentPlaylistId.value)
  return playlist ? playlist.name : 'Default Mix'
})

const playerRef = ref<any>(null)
const isMuted = ref(true)
const isSkipping = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const toggleMute = () => {
  if (!playerRef.value) return
  
  if (isMuted.value) {
    playerRef.value.unMute()
    isMuted.value = false
  } else {
    playerRef.value.mute()
    isMuted.value = true
  }
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const initYT = () => {
  if (window.YT) {
    return Promise.resolve(window.YT)
  }
  return new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
}

const loadVideo = async (videoId: string, startTime: number = 0) => {
  const YT = await initYT()
  
  if (playerRef.value) {
    playerRef.value.loadVideoById({ videoId, startSeconds: startTime })
  } else {
    playerRef.value = new YT.Player('yt-player', {
      videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        playerapiid: 'ytplayer',
      },
      events: {
        onStateChange: (event: any) => {
          if (event.data === YT.PlayerState.ENDED) {
            socket.emit('skip')
          }
          if (event.data === YT.PlayerState.PAUSED) {
            playerRef.value.playVideo()
          }
        }
      }
    })
  }
}

let syncInterval: number | null = null

const startSync = () => {
  if (syncInterval) clearInterval(syncInterval)
  syncInterval = window.setInterval(() => {
    if (playerRef.value?.getCurrentTime) {
      const time = playerRef.value.getCurrentTime()
      const dur = playerRef.value.getDuration()
      
      currentTime.value = time || 0
      if (dur && dur !== duration.value) {
        duration.value = dur
      }
      
      socket.emit('update-time', time)
    }
  }, 1000)
}

watch(currentVideo, (video) => {
  if (video) {
    isSkipping.value = false
    currentTime.value = 0
    duration.value = 0
    loadVideo(video.id)
    startSync()
  }
})

socket.on('time-update', (time: number) => {
  if (playerRef.value?.seekTo && Math.abs(playerRef.value.getCurrentTime() - time) > 2) {
    playerRef.value.seekTo(time, true)
  }
})

onMounted(() => {
  if (currentVideo.value) {
    loadVideo(currentVideo.value.id)
    startSync()
  }
})
</script>

<template>
  <div class="bg-surface0 p-6 relative">
    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-lavender"></div>
    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-lavender"></div>
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-lavender"></div>
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-lavender"></div>
    <h2 class="text-xl font-bold mb-2 text-lavender">Now Playing - {{ currentPlaylistName }}</h2>
    <h3 v-if="currentVideo" class="text-lg font-semibold mb-4 text-text">{{ currentVideo.title }}</h3>
    
    <div v-if="currentVideo" class="space-y-4">
      <div id="yt-player" class="aspect-video bg-crust pointer-events-none max-w-lg mx-auto"></div>
      
      <div class="space-y-2">
        <div class="w-full h-2 bg-surface1 overflow-hidden">
          <div 
            class="h-full bg-lavender transition-all duration-1000"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-sm text-subtext">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-end">
        <div class="flex gap-2">
          <button 
            @click="toggleMute"
            class="bg-surface1 hover:bg-blue hover:scale-105 px-6 py-2 transition-all text-text font-semibold rounded shadow-lg border-2 border-surface2"
          >
            {{ isMuted ? 'Unmute' : 'Mute' }}
          </button>
          <button 
            @click="skip(); isSkipping = true"
            :disabled="isSkipping"
            class="bg-lavender hover:bg-mauve hover:scale-105 px-6 py-2 transition-all text-base font-semibold rounded shadow-lg border-2 border-mauve disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="text-subtext text-center py-8">
      <p>No video playing</p>
      <p class="text-sm mt-2">Add a video to the queue or submit to the mix</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRadio } from '../composables/useRadio'
import { socket } from '../composables/useRadio'

const { currentVideo, skip } = useRadio()

const playerRef = ref<any>(null)
const isMuted = ref(true)
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
  <div class="bg-gray-800 rounded-lg p-6">
    <h2 class="text-xl font-bold mb-4">Now Playing</h2>
    
    <div v-if="currentVideo" class="space-y-4">
      <div id="yt-player" class="aspect-video rounded-lg overflow-hidden bg-black pointer-events-none"></div>
      
      <div class="space-y-2">
        <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            class="h-full bg-purple-500 transition-all duration-1000"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-sm text-gray-400">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold truncate">{{ currentVideo.title }}</h3>
        <div class="flex gap-2">
          <button 
            @click="toggleMute"
            class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            {{ isMuted ? 'Unmute' : 'Mute' }}
          </button>
          <button 
            @click="skip"
            class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="text-gray-400 text-center py-8">
      <p>No video playing</p>
      <p class="text-sm mt-2">Add a video to the queue or submit to the mix</p>
    </div>
  </div>
</template>

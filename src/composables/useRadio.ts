import { ref } from 'vue'
import { io } from 'socket.io-client'
import type { Video, Playlist } from '../types'

export const socket = io()

const queue = ref<Video[]>([])
const currentVideo = ref<Video | null>(null)
const playlists = ref<Playlist[]>([])

socket.on('state', (state: { queue: Video[], currentVideo: Video | null, playlists: Playlist[] }) => {
  queue.value = state.queue
  currentVideo.value = state.currentVideo
  playlists.value = state.playlists
})

export function useRadio() {
  const addToQueue = (url: string) => {
    socket.emit('add-to-queue', url)
  }

  const skip = () => {
    socket.emit('skip')
  }

  const removeFromQueue = (index: number) => {
    socket.emit('remove-from-queue', index)
  }

  const addToMix = (url: string) => {
    socket.emit('add-to-mix', url)
  }

  const addPlaylist = (name: string, url: string) => {
    socket.emit('add-playlist', { name, url })
  }

  return {
    queue,
    currentVideo,
    playlists,
    addToQueue,
    skip,
    removeFromQueue,
    addPlaylist,
    addToMix
  }
}

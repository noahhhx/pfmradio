import { ref } from 'vue'
import { io } from 'socket.io-client'
import type { Video, Playlist } from '../types'

export const socket = io()

const queue = ref<Video[]>([])
const currentVideo = ref<Video | null>(null)
const playlists = ref<Playlist[]>([])
const currentPlaylistId = ref<string>('default-mix')

socket.on('state', (state: { queue: Video[], currentVideo: Video | null, playlists: Playlist[], currentPlaylistId: string }) => {
  queue.value = state.queue
  currentVideo.value = state.currentVideo
  playlists.value = state.playlists
  currentPlaylistId.value = state.currentPlaylistId
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

  const switchPlaylist = (playlistId: string) => {
    socket.emit('switch-playlist', playlistId)
  }

  return {
    queue,
    currentVideo,
    playlists,
    currentPlaylistId,
    addToQueue,
    skip,
    removeFromQueue,
    addPlaylist,
    addToMix,
    switchPlaylist
  }
}

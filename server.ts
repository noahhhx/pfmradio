import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = process.env.DATA_DIR || __dirname
const DATA_FILE = join(DATA_DIR, 'data.json')

interface Video {
  id: string
  title: string
  thumbnail: string
}

interface Playlist {
  id: string
  name: string
  videos: Video[]
}

interface State {
  queue: Video[]
  currentVideo: Video | null
  playlists: Playlist[]
  currentPlaylistId: string
  currentTime: number
  isPlaying: boolean
}

const loadState = (): Partial<State> => {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load state:', e)
  }
  return {}
}

const saveState = () => {
  try {
    const toSave = {
      playlists: state.playlists
    }
    writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

const saved = loadState()

const state: State = {
  queue: [],
  currentVideo: null,
  playlists: saved.playlists || [{
    id: 'default-mix',
    name: 'Default Mix',
    videos: []
  }],
  currentPlaylistId: 'default-mix',
  currentTime: 0,
  isPlaying: false
}

const app = express()
app.use(cors())

app.use(express.static(join(__dirname, 'dist')))

app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

const getVideoInfo = async (videoId: string): Promise<Video> => {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    console.log('Fetching video info for:', videoId)
    const response = await fetch(url)
    const data = await response.json()
    console.log('Got title:', data.title)
    return {
      id: videoId,
      title: data.title || 'Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  } catch (error) {
    console.error('Error fetching video info:', error)
    return {
      id: videoId,
      title: 'Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  }
}

const broadcastState = () => {
  io.emit('state', state)
}

const playNext = () => {
  if (state.queue.length > 0) {
    state.currentVideo = state.queue.shift() || null
  } else {
    const currentPlaylist = state.playlists.find(p => p.id === state.currentPlaylistId)
    if (currentPlaylist && currentPlaylist.videos.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentPlaylist.videos.length)
      state.currentVideo = currentPlaylist.videos[randomIndex] || null
    } else {
      state.currentVideo = null
    }
  }
  broadcastState()
}

io.on('connection', (socket) => {
  console.log('Client connected')
  
  socket.emit('state', state)
  
  socket.on('add-to-queue', async (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) return
    
    const video = await getVideoInfo(videoId)
    
    state.queue.push(video)
    
    if (!state.currentVideo) {
      playNext()
    } else {
      broadcastState()
    }
  })
  
  socket.on('skip', () => {
    playNext()
  })
  
  socket.on('remove-from-queue', (index: number) => {
    state.queue.splice(index, 1)
    broadcastState()
  })
  
  socket.on('add-to-mix', async (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) return
    
    const video = await getVideoInfo(videoId)
    
    const defaultMix = state.playlists.find(p => p.id === 'default-mix')
    if (defaultMix) {
      defaultMix.videos.push(video)
    }
    
    saveState()
    
    if (!state.currentVideo) {
      playNext()
    } else {
      broadcastState()
    }
  })
  
  socket.on('add-playlist', async ({ name, url }: { name: string, url: string }) => {
    const videoId = extractVideoId(url)
    if (!videoId) return
    
    const video = await getVideoInfo(videoId)
    
    const existing = state.playlists.find(p => p.name === name)
    if (existing) {
      existing.videos.push(video)
    } else {
      state.playlists.push({
        id: `playlist-${Date.now()}`,
        name,
        videos: [video]
      })
    }
    
    saveState()
    broadcastState()
  })

  socket.on('remove-from-playlist', ({ playlistId, videoIndex }: { playlistId: string, videoIndex: number }) => {
    const playlist = state.playlists.find(p => p.id === playlistId)
    if (playlist) {
      playlist.videos.splice(videoIndex, 1)
      saveState()
      broadcastState()
    }
  })

  socket.on('switch-playlist', (playlistId: string) => {
    state.currentPlaylistId = playlistId
    playNext()
  })

  socket.on('update-playing', (playing: boolean) => {
    state.isPlaying = playing
    socket.broadcast.emit('playing-update', playing)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  
  // Update existing videos with real titles
  let updated = false
  for (const playlist of state.playlists) {
    for (const video of playlist.videos) {
      if (video.title === 'Video') {
        console.log(`Updating title for video ${video.id}`)
        const info = await getVideoInfo(video.id)
        video.title = info.title
        updated = true
      }
    }
  }
  if (updated) {
    saveState()
    console.log('Updated video titles')
  }
  
  if (!state.currentVideo) {
    playNext()
  }
})

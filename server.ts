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
    if (match && match[1]) return match[1]
  }
  return null
}

const broadcastState = () => {
  io.emit('state', state)
}

const playNext = () => {
  if (state.queue.length > 0) {
    state.currentVideo = state.queue.shift() || null
  } else {
    const defaultMix = state.playlists.find(p => p.id === 'default-mix')
    if (defaultMix && defaultMix.videos.length > 0) {
      const randomIndex = Math.floor(Math.random() * defaultMix.videos.length)
      state.currentVideo = defaultMix.videos[randomIndex] || null
    } else {
      state.currentVideo = null
    }
  }
  broadcastState()
}

io.on('connection', (socket) => {
  console.log('Client connected')
  
  socket.emit('state', state)
  
  socket.on('add-to-queue', (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) return
    
    const video: Video = {
      id: videoId,
      title: 'Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
    
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
  
  socket.on('add-to-mix', (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) return
    
    const video: Video = {
      id: videoId,
      title: 'Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
    
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
  
  socket.on('add-playlist', ({ name, url }: { name: string, url: string }) => {
    const videoId = extractVideoId(url)
    if (!videoId) return
    
    const video: Video = {
      id: videoId,
      title: 'Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
    
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

  socket.on('update-time', (time: number) => {
    state.currentTime = time
    socket.broadcast.emit('time-update', time)
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
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

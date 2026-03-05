# PFM Radio

A simple radio-style web app for playing YouTube videos in a continuous stream. All users share the same queue and currently playing video in real-time.

## Features

- **Real-time Sync**: Everyone sees the same queue and currently playing video
- **Now Playing**: Displays current video with thumbnail and skip functionality
- **Queue**: Add YouTube videos to play next
- **Mix Playlist**: Submit videos to the default mix that plays when queue is empty
- **Playlists**: Create and manage custom playlists

## Tech Stack

- Vue 3 + TypeScript
- Tailwind CSS
- Socket.IO for real-time sync
- Node.js server

## Development

```bash
# Install dependencies
npm install

# Run backend server (in one terminal)
npm run server

# Run frontend (in another terminal)
npm run dev
```

## Deployment

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

This will:
- Build and start the container
- Persist playlist data in a named volume
- Auto-restart on failure

### Using Docker directly

```bash
docker build -t pfmradio .
docker run -p 3001:3001 pfmradio
```

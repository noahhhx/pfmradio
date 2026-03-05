export interface Video {
  id: string
  title: string
  thumbnail: string
  duration?: string
}

export interface Playlist {
  id: string
  name: string
  videos: Video[]
}

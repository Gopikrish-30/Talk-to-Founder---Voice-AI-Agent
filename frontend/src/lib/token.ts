import axios from 'axios'
import { Room } from 'livekit-client'

const TOKEN_SERVER_URL = (import.meta as any).env?.VITE_TOKEN_SERVER_URL || 'http://localhost:8000'

export interface TokenResponse {
  token: string
  url: string
}

/**
 * Fetch a JWT token from the token server
 * Used to authenticate with LiveKit
 */
export async function getToken(room: string, username: string): Promise<TokenResponse> {
  try {
    const response = await axios.get<TokenResponse>(`${TOKEN_SERVER_URL}/token`, {
      params: {
        room,
        username,
      },
    })
    
    if (!response.data.token || !response.data.url) {
      throw new Error('Invalid token response')
    }
    
    console.log('[Token] Received token for room:', room)
    return response.data
  } catch (error) {
    console.error('[Token] Failed to get token:', error)
    throw error
  }
}

/**
 * Health check for token server
 */
export async function checkTokenServerHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${TOKEN_SERVER_URL}/health`)
    return response.data.status === 'ok' && response.data.livekit_connected
  } catch {
    return false
  }
}

/**
 * Connect to LiveKit room with WebRTC
 */
export async function connectToRoom(url: string, token: string): Promise<Room> {
  try {
    console.log('[LiveKit] Connecting to room at:', url)
    
    const room = new Room()
    await room.connect(url, token)
    
    console.log('[LiveKit] Connected successfully')
    return room
  } catch (error) {
    console.error('[LiveKit] Connection failed:', error)
    throw error
  }
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Client, ReconnectionTimeMode } from "@stomp/stompjs"

import { getChatToken } from "@/lib/admin/actions"
import type { ChatMessage } from "@/lib/api/admin-types"

export type ChatSocketStatus = "connecting" | "connected" | "disconnected"

/**
 * STOMP chat connection, as in lapa-link-frontend: same-origin `/ws` (see the rewrite in next.config.ts),
 * a fresh token on every (re)connect, exponential backoff 1s → 30s. Delivers own echoes, edits and
 * deletions of messages in `conversationId` and send rejections from `/user/queue/errors`.
 */
export function useChatSocket({
  conversationId,
  enabled,
  onMessage,
  onError,
}: {
  conversationId: string | null
  enabled: boolean
  onMessage: (message: ChatMessage) => void
  onError: (message: string) => void
}) {
  const [status, setStatus] = useState<ChatSocketStatus>("disconnected")
  const client = useRef<Client | null>(null)
  const handlers = useRef({ onMessage, onError })
  useEffect(() => {
    handlers.current = { onMessage, onError }
  })

  useEffect(() => {
    if (!enabled || !conversationId) return
    const { protocol, host } = window.location
    const stomp = new Client({
      brokerURL: `${protocol === "https:" ? "wss:" : "ws:"}//${host}/ws`,
      connectionTimeout: 20_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      reconnectDelay: 1000,
      maxReconnectDelay: 30_000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    })
    stomp.beforeConnect = async () => {
      const token = await getChatToken()
      if (!token) {
        void stomp.deactivate()
        return
      }
      stomp.connectHeaders = { Authorization: `Bearer ${token}`, "Accept-Language": "ru" }
      setStatus("connecting")
    }
    stomp.onConnect = () => {
      stomp.subscribe("/user/queue/messages", (frame) => {
        const message = parse<ChatMessage>(frame.body)
        if (message?.conversationId === conversationId) handlers.current.onMessage(message)
      })
      stomp.subscribe("/user/queue/errors", (frame) => {
        const error = parse<{ message?: string }>(frame.body)
        handlers.current.onError(error?.message ?? "Сообщение не отправлено")
      })
      setStatus("connected")
    }
    stomp.onWebSocketClose = () => setStatus("disconnected")
    stomp.activate()
    client.current = stomp
    return () => {
      client.current = null
      void stomp.deactivate()
    }
  }, [enabled, conversationId])

  function send(text: string) {
    if (!client.current?.connected || !conversationId) return false
    client.current.publish({
      destination: `/app/conversations/${conversationId}/messages`,
      body: JSON.stringify({ clientMessageId: crypto.randomUUID(), text }),
    })
    return true
  }

  return { status, send }
}

function parse<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T
  } catch {
    return null
  }
}

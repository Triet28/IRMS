import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket(topics, onMessage) {
  const clientRef   = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Always keep the ref pointing at the latest callback without recreating the socket
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!topics || topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        topics.forEach((topic) => {
          client.subscribe(topic, (msg) => {
            try {
              onMessageRef.current(topic, JSON.parse(msg.body));
            } catch {
              onMessageRef.current(topic, msg.body);
            }
          });
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, [topics.join(',')]);
}

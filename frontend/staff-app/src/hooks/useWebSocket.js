import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * ISP: hook is focused solely on WebSocket subscription.
 * Components pick only the topics they care about — no coupling to HTTP logic.
 *
 * @param {string[]} topics - e.g. ['/topic/kitchen', '/topic/session/5']
 * @param {function} onMessage - callback(topic, payload)
 */
export function useWebSocket(topics, onMessage) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!topics || topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        topics.forEach((topic) => {
          client.subscribe(topic, (msg) => {
            try {
              onMessage(topic, JSON.parse(msg.body));
            } catch {
              onMessage(topic, msg.body);
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

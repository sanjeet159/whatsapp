import { mockStore, MOCK_QR_CODE_DATA_URL } from './mockData';
import type {
  Session,
  Chat,
  ChatMessage,
  Webhook,
  MessageTemplate,
  ApiKey,
  CreatedApiKey,
} from './api';

export async function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const [pathPart, queryPart] = endpoint.split('?');
  const path = pathPart.replace(/^\/+/, '');
  const params = new URLSearchParams(queryPart || '');
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};

  // Artificial slight latency for realistic feeling
  await new Promise(r => setTimeout(r, 60));

  // --- Auth Validate ---
  if (path === 'auth/validate') {
    return {
      valid: true,
      role: 'admin',
      engineType: 'baileys',
      scoped: false,
    } as unknown as T;
  }

  // --- Sessions Overview Stats ---
  if (path === 'sessions/stats/overview') {
    const sessions = mockStore.getState().sessions;
    const ready = sessions.filter(s => s.status === 'ready').length;
    const active = sessions.filter(s => s.status !== 'disconnected' && s.status !== 'failed').length;
    return {
      total: sessions.length,
      active,
      ready,
      disconnected: sessions.length - active,
      byStatus: {
        ready,
        qr_ready: sessions.filter(s => s.status === 'qr_ready').length,
        disconnected: sessions.filter(s => s.status === 'disconnected').length,
      },
      memoryUsage: { heapUsed: 142000000, heapTotal: 280000000, rss: 340000000 },
    } as unknown as T;
  }

  // --- Sessions list / create ---
  if (path === 'sessions') {
    if (method === 'GET') {
      return mockStore.getState().sessions as unknown as T;
    }
    if (method === 'POST') {
      const newSession: Session = {
        id: 'session-' + Date.now().toString(36),
        name: body.name || 'New WhatsApp Session',
        status: 'qr_ready',
        phone: null,
        pushName: null,
        engineLoaded: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.updateState(prev => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
      }));
      return newSession as unknown as T;
    }
  }

  // --- Single Session Operations (/sessions/:id/...) ---
  const sessionMatch = path.match(/^sessions\/([^/]+)(?:\/(.*))?$/);
  if (sessionMatch) {
    const sessionId = decodeURIComponent(sessionMatch[1]);
    const subRoute = sessionMatch[2] || '';

    // GET /sessions/:id
    if (!subRoute && method === 'GET') {
      const session = mockStore.getState().sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');
      return session as unknown as T;
    }

    // DELETE /sessions/:id
    if (!subRoute && method === 'DELETE') {
      mockStore.updateState(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId),
      }));
      return undefined as unknown as T;
    }

    // Lifecycle actions: start, stop, logout, force-kill
    if (subRoute === 'start') {
      let updated: Session | undefined;
      mockStore.updateState(prev => {
        const next = prev.sessions.map(s => {
          if (s.id === sessionId) {
            updated = { ...s, status: 'ready', engineLoaded: true, connectedAt: new Date().toISOString(), phone: s.phone || '+14155552671' };
            return updated;
          }
          return s;
        });
        return { ...prev, sessions: next };
      });
      return updated as unknown as T;
    }

    if (subRoute === 'stop' || subRoute === 'force-kill') {
      let updated: Session | undefined;
      mockStore.updateState(prev => {
        const next = prev.sessions.map(s => {
          if (s.id === sessionId) {
            updated = { ...s, status: 'disconnected', engineLoaded: false };
            return updated;
          }
          return s;
        });
        return { ...prev, sessions: next };
      });
      return updated as unknown as T;
    }

    if (subRoute === 'logout') {
      let updated: Session | undefined;
      mockStore.updateState(prev => {
        const next = prev.sessions.map(s => {
          if (s.id === sessionId) {
            updated = { ...s, status: 'qr_ready', phone: null, pushName: null, connectedAt: null };
            return updated;
          }
          return s;
        });
        return { ...prev, sessions: next };
      });
      return updated as unknown as T;
    }

    if (subRoute === 'qr') {
      return { qrCode: MOCK_QR_CODE_DATA_URL, status: 'qr_ready' } as unknown as T;
    }

    if (subRoute === 'pairing-code') {
      return { pairingCode: '8X49-2KZ1', status: 'pairing' } as unknown as T;
    }

    if (subRoute === 'config') {
      if (method === 'PATCH') {
        mockStore.updateState(prev => ({
          ...prev,
          sessionConfigs: {
            ...prev.sessionConfigs,
            [sessionId]: { ...(prev.sessionConfigs[sessionId] || { autoRejectCalls: false, maxReconnectAttempts: 5, reconnectBaseDelay: 3000 }), ...body },
          },
        }));
      }
      const cfg = mockStore.getState().sessionConfigs[sessionId] || {
        autoRejectCalls: false,
        maxReconnectAttempts: 5,
        reconnectBaseDelay: 3000,
      };
      return cfg as unknown as T;
    }

    if (subRoute === 'proxy') {
      const proxy = mockStore.getState().sessionProxies[sessionId] || {
        enabled: false,
        proxyType: null,
        proxyHost: null,
        hasCredentials: false,
      };
      return proxy as unknown as T;
    }

    // Chats
    if (subRoute === 'chats') {
      const chats = mockStore.getState().chats[sessionId] || mockStore.getState().chats['session-primary'] || [];
      return chats as unknown as T;
    }

    if (subRoute === 'chats/read' || subRoute === 'chats/unread') {
      const chatId = body.chatId;
      mockStore.updateState(prev => {
        const sessionChats = prev.chats[sessionId] || prev.chats['session-primary'] || [];
        const updatedChats = sessionChats.map(c => (c.id === chatId ? { ...c, unreadCount: subRoute.endsWith('read') ? 0 : 1 } : c));
        return { ...prev, chats: { ...prev.chats, [sessionId]: updatedChats } };
      });
      return { success: true } as unknown as T;
    }

    if (subRoute === 'chats/pin') {
      const chatId = body.chatId;
      mockStore.updateState(prev => {
        const sessionChats = prev.chats[sessionId] || prev.chats['session-primary'] || [];
        const updatedChats = sessionChats.map(c => (c.id === chatId ? { ...c, pinned: !!body.pin } : c));
        return { ...prev, chats: { ...prev.chats, [sessionId]: updatedChats } };
      });
      return { success: true } as unknown as T;
    }

    if (subRoute === 'chats/archive') {
      const chatId = body.chatId;
      mockStore.updateState(prev => {
        const sessionChats = prev.chats[sessionId] || prev.chats['session-primary'] || [];
        const updatedChats = sessionChats.map(c => (c.id === chatId ? { ...c, archived: !!body.archive } : c));
        return { ...prev, chats: { ...prev.chats, [sessionId]: updatedChats } };
      });
      return { success: true } as unknown as T;
    }

    if (subRoute === 'chats/mute') {
      const chatId = body.chatId;
      mockStore.updateState(prev => {
        const sessionChats = prev.chats[sessionId] || prev.chats['session-primary'] || [];
        const updatedChats = sessionChats.map(c => (c.id === chatId ? { ...c, muted: !!body.muteUntil } : c));
        return { ...prev, chats: { ...prev.chats, [sessionId]: updatedChats } };
      });
      return { success: true } as unknown as T;
    }

    // Messages
    if (subRoute.startsWith('messages')) {
      const chatId = params.get('chatId') || (body.chatId as string);
      const key = `${sessionId}:${chatId}`;
      const defaultKey = `session-primary:${chatId}`;

      // Send message endpoints
      if (subRoute.startsWith('messages/send-') || subRoute === 'messages/reply') {
        const textContent = body.text || body.caption || (body.content?.text) || (body.name ? `Poll: ${body.name}` : 'Message');
        const nowSec = Math.floor(Date.now() / 1000);
        const newMsg: ChatMessage = {
          id: 'msg-' + Date.now().toString(36),
          waMessageId: 'WA-OUT-' + Date.now().toString(36).toUpperCase(),
          chatId,
          from: 'me',
          to: chatId,
          body: textContent,
          type: (body.options ? 'poll' : subRoute.replace('messages/send-', '') as any) || 'text',
          direction: 'outgoing',
          status: 'delivered',
          timestamp: nowSec,
          createdAt: new Date().toISOString(),
        };

        mockStore.updateState(prev => {
          const existing = prev.messages[key] || prev.messages[defaultKey] || [];
          const sessionChats = prev.chats[sessionId] || prev.chats['session-primary'] || [];
          const updatedChats = sessionChats.map(c => (c.id === chatId ? { ...c, lastMessage: textContent, timestamp: nowSec } : c));
          return {
            ...prev,
            messages: { ...prev.messages, [key]: [...existing, newMsg] },
            chats: { ...prev.chats, [sessionId]: updatedChats },
          };
        });

        // Trigger realistic automated reply after 1.5 seconds if this is an individual chat
        if (chatId && chatId.endsWith('@c.us')) {
          setTimeout(() => {
            const replies = [
              'Got it! Thanks for keeping me updated.',
              'Received! I will review this shortly.',
              'Perfect, appreciate the quick turnaround!',
              'Thanks for reaching out! Let me know if you need anything else.',
            ];
            const autoReplyText = replies[Math.floor(Math.random() * replies.length)];
            const replyMsg: ChatMessage = {
              id: 'msg-reply-' + Date.now().toString(36),
              waMessageId: 'WA-IN-' + Date.now().toString(36).toUpperCase(),
              chatId,
              from: chatId,
              to: 'me',
              body: autoReplyText,
              type: 'text',
              direction: 'incoming',
              status: 'read',
              timestamp: Math.floor(Date.now() / 1000),
              createdAt: new Date().toISOString(),
            };
            mockStore.updateState(prev => {
              const currentList = prev.messages[key] || prev.messages[defaultKey] || [];
              const sChats = prev.chats[sessionId] || prev.chats['session-primary'] || [];
              const upChats = sChats.map(c => (c.id === chatId ? { ...c, lastMessage: autoReplyText, timestamp: Math.floor(Date.now() / 1000) } : c));
              return {
                ...prev,
                messages: { ...prev.messages, [key]: [...currentList, replyMsg] },
                chats: { ...prev.chats, [sessionId]: upChats },
              };
            });
          }, 1500);
        }

        return { messageId: newMsg.id, timestamp: nowSec } as unknown as T;
      }

      // History
      if (subRoute.includes('/history')) {
        const msgs = mockStore.getState().messages[key] || mockStore.getState().messages[defaultKey] || [];
        return msgs.map(m => ({
          id: m.id,
          chatId: m.chatId,
          from: m.from,
          to: m.to,
          body: m.body,
          type: m.type,
          timestamp: m.timestamp || Math.floor(Date.now() / 1000),
          fromMe: m.direction === 'outgoing',
          isGroup: m.chatId.includes('@g.us'),
          kind: m.chatId.includes('@g.us') ? 'group' : 'individual',
        })) as unknown as T;
      }

      // Message list for chat
      const msgs = mockStore.getState().messages[key] || mockStore.getState().messages[defaultKey] || [];
      return { messages: msgs, total: msgs.length } as unknown as T;
    }

    // Contacts
    if (subRoute === 'contacts') {
      const contacts = mockStore.getState().contacts[sessionId] || mockStore.getState().contacts['session-primary'] || [];
      return contacts as unknown as T;
    }

    if (subRoute.startsWith('contacts/check/')) {
      const num = decodeURIComponent(subRoute.replace('contacts/check/', ''));
      return { number: num, exists: true, whatsappId: num + '@c.us' } as unknown as T;
    }

    if (subRoute.includes('/profile-picture')) {
      return { url: null } as unknown as T;
    }

    if (subRoute.startsWith('contacts/profile-pictures')) {
      return { pictures: {} } as unknown as T;
    }

    if (subRoute === 'contacts/blocked') {
      return [] as unknown as T;
    }

    // Groups
    if (subRoute === 'groups') {
      const groups = mockStore.getState().groups[sessionId] || mockStore.getState().groups['session-primary'] || [];
      return groups.map(g => ({ id: g.id, name: g.name })) as unknown as T;
    }

    if (subRoute.startsWith('groups/')) {
      const grpId = decodeURIComponent(subRoute.replace('groups/', ''));
      const groups = mockStore.getState().groups[sessionId] || mockStore.getState().groups['session-primary'] || [];
      const grp = groups.find(g => g.id === grpId);
      return (grp || groups[0]) as unknown as T;
    }

    // Channels
    if (subRoute === 'channels') {
      const channels = mockStore.getState().channels[sessionId] || mockStore.getState().channels['session-primary'] || [];
      return channels as unknown as T;
    }

    // Status
    if (subRoute === 'status') {
      const statuses = mockStore.getState().statusUpdates[sessionId] || mockStore.getState().statusUpdates['session-primary'] || [];
      return { statuses } as unknown as T;
    }

    // Webhooks by session
    if (subRoute === 'webhooks') {
      if (method === 'POST') {
        const newWebhook: Webhook = {
          id: 'wh-' + Date.now().toString(36),
          sessionId,
          url: body.url || 'https://example.com/webhook',
          events: body.events || ['message.received'],
          filters: body.filters || null,
          active: true,
          retryCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockStore.updateState(prev => ({ ...prev, webhooks: [...prev.webhooks, newWebhook] }));
        return newWebhook as unknown as T;
      }
      return mockStore.getState().webhooks.filter(w => w.sessionId === sessionId) as unknown as T;
    }

    // Templates
    if (subRoute === 'templates') {
      if (method === 'POST') {
        const newTmpl: MessageTemplate = {
          id: 'tmpl-' + Date.now().toString(36),
          sessionId,
          name: body.name || 'New Template',
          body: body.body || '',
          header: body.header || null,
          footer: body.footer || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockStore.updateState(prev => {
          const list = prev.templates[sessionId] || [];
          return { ...prev, templates: { ...prev.templates, [sessionId]: [...list, newTmpl] } };
        });
        return newTmpl as unknown as T;
      }
      return (mockStore.getState().templates[sessionId] || []) as unknown as T;
    }
  }

  // --- Global Webhooks ---
  if (path === 'webhooks') {
    return mockStore.getState().webhooks as unknown as T;
  }

  const webhookTestMatch = path.match(/sessions\/[^/]+\/webhooks\/([^/]+)\/test/);
  if (webhookTestMatch) {
    return { success: true, statusCode: 200 } as unknown as T;
  }

  const webhookSingleMatch = path.match(/sessions\/([^/]+)\/webhooks\/([^/]+)/);
  if (webhookSingleMatch) {
    const whId = webhookSingleMatch[2];
    if (method === 'PUT') {
      let updated: Webhook | undefined;
      mockStore.updateState(prev => {
        const next = prev.webhooks.map(w => {
          if (w.id === whId) {
            updated = { ...w, ...body, updatedAt: new Date().toISOString() };
            return updated;
          }
          return w;
        });
        return { ...prev, webhooks: next };
      });
      return updated as unknown as T;
    }
    if (method === 'DELETE') {
      mockStore.updateState(prev => ({
        ...prev,
        webhooks: prev.webhooks.filter(w => w.id !== whId),
      }));
      return undefined as unknown as T;
    }
  }

  // --- Global Templates ---
  const tmplSingleMatch = path.match(/sessions\/([^/]+)\/templates\/([^/]+)/);
  if (tmplSingleMatch) {
    const sId = tmplSingleMatch[1];
    const tId = tmplSingleMatch[2];
    if (method === 'PUT') {
      let updated: MessageTemplate | undefined;
      mockStore.updateState(prev => {
        const list = prev.templates[sId] || [];
        const next = list.map(t => {
          if (t.id === tId) {
            updated = { ...t, ...body, updatedAt: new Date().toISOString() };
            return updated;
          }
          return t;
        });
        return { ...prev, templates: { ...prev.templates, [sId]: next } };
      });
      return updated as unknown as T;
    }
    if (method === 'DELETE') {
      mockStore.updateState(prev => {
        const list = prev.templates[sId] || [];
        return { ...prev, templates: { ...prev.templates, [sId]: list.filter(t => t.id !== tId) } };
      });
      return undefined as unknown as T;
    }
  }

  // --- API Keys ---
  if (path === 'auth/api-keys') {
    if (method === 'POST') {
      const generatedRawKey = 'wa_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      const newKey: CreatedApiKey = {
        id: 'key-' + Date.now().toString(36),
        name: body.name || 'New API Key',
        keyPrefix: generatedRawKey.slice(0, 8),
        role: body.role || 'operator',
        allowedIps: body.allowedIps || [],
        allowedSessions: body.allowedSessions || [],
        allowedChats: body.allowedChats || [],
        isActive: true,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        apiKey: generatedRawKey,
      };
      mockStore.updateState(prev => ({ ...prev, apiKeys: [newKey, ...prev.apiKeys] }));
      return newKey as unknown as T;
    }
    return mockStore.getState().apiKeys as unknown as T;
  }

  const apiKeySingleMatch = path.match(/^auth\/api-keys\/([^/]+)(?:\/(.*))?$/);
  if (apiKeySingleMatch) {
    const keyId = apiKeySingleMatch[1];
    const keySub = apiKeySingleMatch[2] || '';
    if (keySub === 'revoke' && method === 'POST') {
      let updated: ApiKey | undefined;
      mockStore.updateState(prev => {
        const next = prev.apiKeys.map(k => (k.id === keyId ? (updated = { ...k, isActive: false }) : k));
        return { ...prev, apiKeys: next };
      });
      return updated as unknown as T;
    }
    if (method === 'PUT') {
      let updated: ApiKey | undefined;
      mockStore.updateState(prev => {
        const next = prev.apiKeys.map(k => (k.id === keyId ? (updated = { ...k, ...body }) : k));
        return { ...prev, apiKeys: next };
      });
      return updated as unknown as T;
    }
    if (method === 'DELETE') {
      mockStore.updateState(prev => ({
        ...prev,
        apiKeys: prev.apiKeys.filter(k => k.id !== keyId),
      }));
      return undefined as unknown as T;
    }
  }

  // --- Audit Logs ---
  if (path === 'audit') {
    const logs = mockStore.getState().auditLogs;
    return { data: logs, total: logs.length } as unknown as T;
  }

  // --- Infra & Health ---
  if (path === 'infra/status') {
    return {
      database: { connected: true, type: 'sqlite', host: 'localhost', builtIn: true },
      redis: { enabled: true, connected: true, host: '127.0.0.1', port: 6379, builtIn: true },
      queue: { enabled: true, webhooks: { pending: 0, completed: 84, failed: 1 } },
      storage: { type: 'local', path: '/data/media', builtIn: true },
      engine: { type: 'baileys', headless: true, webVersion: '2.3000.101', webVersionSource: 'auto' },
    } as unknown as T;
  }

  if (path === 'infra/update-check') {
    return {
      current: '0.25.0',
      latest: '0.25.0',
      updateAvailable: false,
      releaseUrl: null,
    } as unknown as T;
  }

  if (path === 'infra/config') {
    return {
      database: {
        type: 'sqlite',
        builtIn: true,
        host: 'localhost',
        port: '5432',
        username: 'openwa',
        database: 'openwa.sqlite',
        schema: 'public',
        poolSize: 10,
        sslEnabled: false,
        sslRejectUnauthorized: false,
        passwordSet: false,
      },
      redis: { enabled: true, builtIn: true, host: '127.0.0.1', port: '6379', passwordSet: false },
      queue: { enabled: true },
      storage: {
        type: 'local',
        builtIn: true,
        localPath: '/data/media',
        s3Bucket: '',
        s3Region: 'us-east-1',
        s3Endpoint: '',
        s3CredentialsSet: false,
      },
      engine: { type: 'baileys', headless: true, sessionDataPath: '/data/sessions', browserArgs: '' },
    } as unknown as T;
  }

  if (path === 'infra/engines') {
    return [
      { id: 'baileys', name: 'Baileys Multi-Device (Fast / Low RAM)', enabled: true, features: ['multi-device', 'fast-startup', 'polls', 'status'] },
      { id: 'whatsapp-web.js', name: 'WhatsApp-Web.js (Headless Chromium)', enabled: true, features: ['multi-device', 'history-backfill', 'browser-fingerprint'] },
    ] as unknown as T;
  }

  if (path === 'infra/engines/current') {
    return { engineType: 'baileys' } as unknown as T;
  }

  if (path === 'health' || path === 'health/ready') {
    return { status: 'ok', version: '0.25.0', details: { database: { status: 'up' }, redis: { status: 'up' }, queue: { status: 'up' } } } as unknown as T;
  }

  // --- Stats API ---
  if (path === 'stats/overview') {
    const sessions = mockStore.getState().sessions;
    return {
      sessions: { active: sessions.length, total: sessions.length, byStatus: { ready: 2, qr_ready: 1 } },
      messages: { sent: 1248, received: 3412, failed: 2, today: { sent: 182, received: 429 } },
    } as unknown as T;
  }

  if (path === 'stats/messages') {
    const points = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      points.push({
        timestamp: new Date(now - i * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sent: Math.floor(Math.random() * 25 + 5),
        received: Math.floor(Math.random() * 60 + 15),
      });
    }
    return {
      timeSeries: points,
      byType: { text: 3200, image: 840, document: 210, voice: 140, poll: 75 },
      bySession: [{ sessionId: 'session-primary', name: 'Sales & Customer Care', sent: 1100, received: 3000 }],
      topChats: [
        { chatId: '14155550192@c.us', chatName: 'Alice Henderson', messageCount: 420 },
        { chatId: '120363024829104829@g.us', chatName: 'Product & Tech Updates', messageCount: 310 },
      ],
    } as unknown as T;
  }

  // --- Plugins ---
  if (path === 'plugins') {
    return [] as unknown as T;
  }

  if (path === 'plugins/catalog') {
    return [
      {
        id: 'chatwoot',
        name: 'Chatwoot Live Chat',
        version: '1.2.0',
        description: 'Two-way synchronization between WhatsApp sessions and Chatwoot inboxes.',
        author: 'OpenWA Community',
        installed: false,
        installedVersion: null,
        updateAvailable: false,
      },
      {
        id: 'typebot',
        name: 'Typebot Automated Flows',
        version: '2.0.1',
        description: 'Conversational WhatsApp chatbot flows powered by Typebot.',
        author: 'OpenWA Community',
        installed: false,
        installedVersion: null,
        updateAvailable: false,
      },
    ] as unknown as T;
  }

  // --- Search ---
  if (path === 'search') {
    const q = (params.get('q') || '').toLowerCase();
    const hits: any[] = [];
    const allMessages = mockStore.getState().messages;
    Object.entries(allMessages).forEach(([key, msgs]) => {
      const parts = key.split(':');
      const sId = parts[0];
      const cId = parts[1];
      msgs.forEach(m => {
        if (!q || m.body.toLowerCase().includes(q)) {
          hits.push({
            messageId: m.id,
            waMessageId: m.waMessageId || m.id,
            sessionId: sId,
            chatId: cId,
            body: m.body,
            snippet: m.body,
            timestamp: m.timestamp || Math.floor(Date.now() / 1000),
            type: m.type,
            direction: m.direction,
            from: m.from,
          });
        }
      });
    });
    return { hits, total: hits.length, tookMs: 12, provider: 'local' } as unknown as T;
  }

  return {} as unknown as T;
}

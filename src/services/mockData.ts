import type {
  Session,
  SessionConfig,
  SessionProxy,
  Chat,
  ChatMessage,
  EngineHistoryMessage,
  Contact,
  GroupInfo,
  Webhook,
  MessageTemplate,
  ApiKey,
  AuditLog,
  InfraStatus,
  SavedConfig,
  Channel,
  StatusUpdate,
} from './api';

const STORAGE_KEY = 'openwa_mock_state_v1';

// A valid SVG-based QR code data URL for WhatsApp Web scan simulation
export const MOCK_QR_CODE_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="white"/>
  <!-- Corner Position Squares -->
  <rect x="20" y="20" width="40" height="40" fill="black"/>
  <rect x="26" y="26" width="28" height="28" fill="white"/>
  <rect x="32" y="32" width="16" height="16" fill="black"/>

  <rect x="140" y="20" width="40" height="40" fill="black"/>
  <rect x="146" y="26" width="28" height="28" fill="white"/>
  <rect x="152" y="32" width="16" height="16" fill="black"/>

  <rect x="20" y="140" width="40" height="40" fill="black"/>
  <rect x="26" y="146" width="28" height="28" fill="white"/>
  <rect x="32" y="152" width="16" height="16" fill="black"/>

  <!-- QR Pattern Mock Modules -->
  <rect x="70" y="25" width="10" height="10" fill="black"/>
  <rect x="90" y="25" width="10" height="10" fill="black"/>
  <rect x="110" y="25" width="10" height="10" fill="black"/>
  <rect x="80" y="45" width="10" height="10" fill="black"/>
  <rect x="100" y="45" width="10" height="10" fill="black"/>
  <rect x="120" y="45" width="10" height="10" fill="black"/>
  <rect x="70" y="65" width="10" height="10" fill="black"/>
  <rect x="90" y="65" width="10" height="10" fill="black"/>
  <rect x="110" y="65" width="10" height="10" fill="black"/>

  <rect x="25" y="70" width="10" height="10" fill="black"/>
  <rect x="45" y="70" width="10" height="10" fill="black"/>
  <rect x="25" y="90" width="10" height="10" fill="black"/>
  <rect x="45" y="90" width="10" height="10" fill="black"/>
  <rect x="25" y="110" width="10" height="10" fill="black"/>
  <rect x="45" y="110" width="10" height="10" fill="black"/>

  <rect x="70" y="85" width="60" height="30" fill="black" rx="4"/>
  <text x="100" y="105" font-family="sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">OpenWA</text>

  <rect x="145" y="70" width="10" height="10" fill="black"/>
  <rect x="165" y="70" width="10" height="10" fill="black"/>
  <rect x="145" y="90" width="10" height="10" fill="black"/>
  <rect x="165" y="90" width="10" height="10" fill="black"/>
  <rect x="145" y="110" width="10" height="10" fill="black"/>
  <rect x="165" y="110" width="10" height="10" fill="black"/>

  <rect x="70" y="125" width="10" height="10" fill="black"/>
  <rect x="90" y="125" width="10" height="10" fill="black"/>
  <rect x="110" y="125" width="10" height="10" fill="black"/>
  <rect x="80" y="145" width="10" height="10" fill="black"/>
  <rect x="100" y="145" width="10" height="10" fill="black"/>
  <rect x="120" y="145" width="10" height="10" fill="black"/>
  <rect x="140" y="145" width="10" height="10" fill="black"/>
  <rect x="160" y="145" width="10" height="10" fill="black"/>
  <rect x="70" y="165" width="10" height="10" fill="black"/>
  <rect x="90" y="165" width="10" height="10" fill="black"/>
  <rect x="110" y="165" width="10" height="10" fill="black"/>
  <rect x="130" y="165" width="10" height="10" fill="black"/>
  <rect x="150" y="165" width="10" height="10" fill="black"/>
  <rect x="170" y="165" width="10" height="10" fill="black"/>
</svg>`);

interface MockState {
  sessions: Session[];
  sessionConfigs: Record<string, SessionConfig>;
  sessionProxies: Record<string, SessionProxy>;
  chats: Record<string, Chat[]>; // keyed by sessionId
  messages: Record<string, ChatMessage[]>; // keyed by `${sessionId}:${chatId}`
  contacts: Record<string, Contact[]>; // keyed by sessionId
  groups: Record<string, GroupInfo[]>; // keyed by sessionId
  channels: Record<string, Channel[]>; // keyed by sessionId
  statusUpdates: Record<string, StatusUpdate[]>; // keyed by sessionId
  webhooks: Webhook[];
  templates: Record<string, MessageTemplate[]>; // keyed by sessionId
  apiKeys: ApiKey[];
  auditLogs: AuditLog[];
}

function getInitialState(): MockState {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const sessions: Session[] = [
    {
      id: 'session-primary',
      name: 'Sales & Customer Care',
      status: 'ready',
      phone: '+14155552671',
      pushName: 'OpenWA Support',
      engineLoaded: true,
      connectedAt: new Date(now - 3600000 * 18).toISOString(),
      lastActive: new Date(now - 60000 * 3).toISOString(),
      createdAt: new Date(now - 86400000 * 14).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 'session-ops',
      name: 'Operations & Alerts',
      status: 'qr_ready',
      phone: null,
      pushName: null,
      engineLoaded: true,
      createdAt: new Date(now - 86400000 * 3).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 'session-marketing',
      name: 'Marketing Newsletter',
      status: 'ready',
      phone: '+14155558902',
      pushName: 'Acme Updates',
      engineLoaded: true,
      connectedAt: new Date(now - 3600000 * 5).toISOString(),
      lastActive: new Date(now - 60000 * 15).toISOString(),
      createdAt: new Date(now - 86400000 * 30).toISOString(),
      updatedAt: nowIso,
    },
  ];

  const sessionConfigs: Record<string, SessionConfig> = {
    'session-primary': {
      autoRejectCalls: false,
      maxReconnectAttempts: 10,
      reconnectBaseDelay: 3000,
    },
    'session-ops': {
      autoRejectCalls: true,
      maxReconnectAttempts: null,
      reconnectBaseDelay: 5000,
    },
    'session-marketing': {
      autoRejectCalls: true,
      maxReconnectAttempts: 5,
      reconnectBaseDelay: 3000,
    },
  };

  const sessionProxies: Record<string, SessionProxy> = {
    'session-primary': {
      enabled: false,
      proxyType: null,
      proxyHost: null,
      hasCredentials: false,
    },
    'session-ops': {
      enabled: false,
      proxyType: null,
      proxyHost: null,
      hasCredentials: false,
    },
    'session-marketing': {
      enabled: false,
      proxyType: null,
      proxyHost: null,
      hasCredentials: false,
    },
  };

  const primaryChats: Chat[] = [
    {
      id: '14155550192@c.us',
      name: 'Alice Henderson',
      isGroup: false,
      kind: 'individual',
      unreadCount: 0,
      timestamp: Math.floor((now - 120000) / 1000),
      lastMessage: 'Thank you so much! The invoice has been received and processed.',
      lastMessageType: 'text',
      archived: false,
      pinned: true,
      muted: false,
    },
    {
      id: '120363024829104829@g.us',
      name: 'Product & Tech Updates',
      isGroup: true,
      kind: 'group',
      unreadCount: 2,
      timestamp: Math.floor((now - 450000) / 1000),
      lastMessage: 'Release v0.25 is live. All endpoints and webhooks are active.',
      lastMessageType: 'text',
      archived: false,
      pinned: true,
      muted: false,
    },
    {
      id: '14155550344@c.us',
      name: 'Bob Martinez',
      isGroup: false,
      kind: 'individual',
      unreadCount: 1,
      timestamp: Math.floor((now - 1800000) / 1000),
      lastMessage: 'Could you please send over the latest service catalog?',
      lastMessageType: 'text',
      archived: false,
      pinned: false,
      muted: false,
    },
    {
      id: '14155550789@c.us',
      name: 'Dr. Marcus Vance',
      isGroup: false,
      kind: 'individual',
      unreadCount: 0,
      timestamp: Math.floor((now - 7200000) / 1000),
      lastMessage: 'Appointment confirmed for tomorrow at 10:00 AM.',
      lastMessageType: 'text',
      archived: false,
      pinned: false,
      muted: false,
    },
    {
      id: '120363098765432100@g.us',
      name: 'VIP Client Community',
      isGroup: true,
      kind: 'group',
      unreadCount: 0,
      timestamp: Math.floor((now - 14400000) / 1000),
      lastMessage: 'Welcome to all our new community members! Check the guidelines in the group info.',
      lastMessageType: 'text',
      archived: false,
      pinned: false,
      muted: false,
    },
  ];

  const primaryContacts: Contact[] = [
    {
      id: '14155550192@c.us',
      name: 'Alice Henderson',
      pushName: 'Alice H.',
      number: '14155550192',
      isMyContact: true,
      isBlocked: false,
    },
    {
      id: '14155550344@c.us',
      name: 'Bob Martinez',
      pushName: 'Bob',
      number: '14155550344',
      isMyContact: true,
      isBlocked: false,
    },
    {
      id: '14155550789@c.us',
      name: 'Dr. Marcus Vance',
      pushName: 'Dr. Vance',
      number: '14155550789',
      isMyContact: true,
      isBlocked: false,
    },
    {
      id: '14155550999@c.us',
      name: 'Clara Oswald',
      pushName: 'Clara',
      number: '14155550999',
      isMyContact: true,
      isBlocked: false,
    },
  ];

  const primaryGroups: GroupInfo[] = [
    {
      id: '120363024829104829@g.us',
      name: 'Product & Tech Updates',
      description: 'Official announcements and release status for the engineering and ops teams.',
      owner: '14155552671@c.us',
      createdAt: Math.floor((now - 86400000 * 20) / 1000),
      locked: false,
      announce: true,
      participants: [
        { id: '14155552671@c.us', number: '14155552671', name: 'OpenWA Support (You)', isAdmin: true, isSuperAdmin: true },
        { id: '14155550192@c.us', number: '14155550192', name: 'Alice Henderson', isAdmin: true, isSuperAdmin: false },
        { id: '14155550344@c.us', number: '14155550344', name: 'Bob Martinez', isAdmin: false, isSuperAdmin: false },
      ],
    },
    {
      id: '120363098765432100@g.us',
      name: 'VIP Client Community',
      description: 'Exclusive community channel for enterprise partners and early adopters.',
      owner: '14155552671@c.us',
      createdAt: Math.floor((now - 86400000 * 60) / 1000),
      locked: false,
      announce: false,
      participants: [
        { id: '14155552671@c.us', number: '14155552671', name: 'OpenWA Support (You)', isAdmin: true, isSuperAdmin: true },
        { id: '14155550789@c.us', number: '14155550789', name: 'Dr. Marcus Vance', isAdmin: false, isSuperAdmin: false },
        { id: '14155550999@c.us', number: '14155550999', name: 'Clara Oswald', isAdmin: false, isSuperAdmin: false },
      ],
    },
  ];

  const sampleMessagesAlice: ChatMessage[] = [
    {
      id: 'msg-alice-1',
      waMessageId: 'WA-MSG-001',
      chatId: '14155550192@c.us',
      from: '14155550192@c.us',
      to: '14155552671@c.us',
      body: 'Hello! I would like to inquire about the enterprise API integration.',
      type: 'text',
      direction: 'incoming',
      status: 'read',
      timestamp: Math.floor((now - 3600000 * 2) / 1000),
      createdAt: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg-alice-2',
      waMessageId: 'WA-MSG-002',
      chatId: '14155550192@c.us',
      from: '14155552671@c.us',
      to: '14155550192@c.us',
      body: 'Hi Alice! Great to connect with you. OpenWA offers full self-hosted REST API endpoints, webhooks, and multi-session WhatsApp capabilities.',
      type: 'text',
      direction: 'outgoing',
      status: 'read',
      timestamp: Math.floor((now - 3600000 * 1.9) / 1000),
      createdAt: new Date(now - 3600000 * 1.9).toISOString(),
    },
    {
      id: 'msg-alice-3',
      waMessageId: 'WA-MSG-003',
      chatId: '14155550192@c.us',
      from: '14155552671@c.us',
      to: '14155550192@c.us',
      body: 'Here is our feature documentation overview.',
      type: 'text',
      direction: 'outgoing',
      status: 'read',
      timestamp: Math.floor((now - 3600000 * 1.8) / 1000),
      createdAt: new Date(now - 3600000 * 1.8).toISOString(),
    },
    {
      id: 'msg-alice-4',
      waMessageId: 'WA-MSG-004',
      chatId: '14155550192@c.us',
      from: '14155550192@c.us',
      to: '14155552671@c.us',
      body: 'Thank you so much! The invoice has been received and processed.',
      type: 'text',
      direction: 'incoming',
      status: 'read',
      timestamp: Math.floor((now - 120000) / 1000),
      createdAt: new Date(now - 120000).toISOString(),
    },
  ];

  const sampleMessagesGroup: ChatMessage[] = [
    {
      id: 'msg-grp-1',
      waMessageId: 'WA-MSG-G01',
      chatId: '120363024829104829@g.us',
      author: '14155550192@c.us',
      chatName: 'Alice Henderson',
      from: '120363024829104829@g.us',
      to: '14155552671@c.us',
      body: 'Team, are we ready for the v0.25 deployment?',
      type: 'text',
      direction: 'incoming',
      status: 'read',
      timestamp: Math.floor((now - 900000) / 1000),
      createdAt: new Date(now - 900000).toISOString(),
    },
    {
      id: 'msg-grp-2',
      waMessageId: 'WA-MSG-G02',
      chatId: '120363024829104829@g.us',
      from: '14155552671@c.us',
      to: '120363024829104829@g.us',
      body: 'Yes, all container checks passed and tests succeeded.',
      type: 'text',
      direction: 'outgoing',
      status: 'read',
      timestamp: Math.floor((now - 600000) / 1000),
      createdAt: new Date(now - 600000).toISOString(),
    },
    {
      id: 'msg-grp-3',
      waMessageId: 'WA-MSG-G03',
      chatId: '120363024829104829@g.us',
      from: '14155552671@c.us',
      to: '120363024829104829@g.us',
      body: 'Release v0.25 is live. All endpoints and webhooks are active.',
      type: 'text',
      direction: 'outgoing',
      status: 'read',
      timestamp: Math.floor((now - 450000) / 1000),
      createdAt: new Date(now - 450000).toISOString(),
    },
  ];

  const sampleMessagesBob: ChatMessage[] = [
    {
      id: 'msg-bob-1',
      waMessageId: 'WA-MSG-B01',
      chatId: '14155550344@c.us',
      from: '14155550344@c.us',
      to: '14155552671@c.us',
      body: 'Could you please send over the latest service catalog?',
      type: 'text',
      direction: 'incoming',
      status: 'read',
      timestamp: Math.floor((now - 1800000) / 1000),
      createdAt: new Date(now - 1800000).toISOString(),
    },
  ];

  const messages: Record<string, ChatMessage[]> = {
    'session-primary:14155550192@c.us': sampleMessagesAlice,
    'session-primary:120363024829104829@g.us': sampleMessagesGroup,
    'session-primary:14155550344@c.us': sampleMessagesBob,
  };

  const webhooks: Webhook[] = [
    {
      id: 'wh-crm-01',
      sessionId: 'session-primary',
      url: 'https://api.crm.example.com/webhooks/whatsapp',
      events: ['message.received', 'message.sent', 'session.status'],
      filters: null,
      active: true,
      retryCount: 3,
      lastTriggeredAt: new Date(now - 60000 * 2).toISOString(),
      createdAt: new Date(now - 86400000 * 10).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 'wh-slack-02',
      sessionId: 'session-primary',
      url: 'https://hooks.slack.com/services/T00/B00/X00',
      events: ['session.status', 'session.auth_failure'],
      filters: null,
      active: true,
      retryCount: 5,
      lastTriggeredAt: new Date(now - 3600000 * 12).toISOString(),
      createdAt: new Date(now - 86400000 * 5).toISOString(),
      updatedAt: nowIso,
    },
  ];

  const templates: Record<string, MessageTemplate[]> = {
    'session-primary': [
      {
        id: 'tmpl-order-confirm',
        sessionId: 'session-primary',
        name: 'Order Confirmation',
        body: 'Hi {{1}}, your order #{{2}} has been confirmed and is being prepared for dispatch. Estimated delivery: {{3}}.',
        header: 'Order Update',
        footer: 'Thank you for choosing us!',
        createdAt: new Date(now - 86400000 * 8).toISOString(),
        updatedAt: nowIso,
      },
      {
        id: 'tmpl-support-ticket',
        sessionId: 'session-primary',
        name: 'Support Ticket Created',
        body: 'Hello {{1}}, ticket #{{2}} has been created for your request: "{{3}}". A support engineer will respond within 1 business hour.',
        header: 'Customer Support',
        footer: 'OpenWA Automated Notification',
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        updatedAt: nowIso,
      },
    ],
  };

  const apiKeys: ApiKey[] = [
    {
      id: 'key-admin-01',
      name: 'Master Admin Token',
      keyPrefix: 'wa_adm_9f3',
      role: 'admin',
      isActive: true,
      usageCount: 1420,
      lastUsedAt: new Date(now - 60000 * 5).toISOString(),
      createdAt: new Date(now - 86400000 * 30).toISOString(),
    },
    {
      id: 'key-operator-01',
      name: 'CRM Messaging Operator',
      keyPrefix: 'wa_opr_4b8',
      role: 'operator',
      allowedSessions: ['session-primary'],
      isActive: true,
      usageCount: 684,
      lastUsedAt: new Date(now - 60000 * 12).toISOString(),
      createdAt: new Date(now - 86400000 * 12).toISOString(),
    },
    {
      id: 'key-viewer-01',
      name: 'Dashboard Read-Only Analytics',
      keyPrefix: 'wa_viw_7c1',
      role: 'viewer',
      isActive: true,
      usageCount: 92,
      lastUsedAt: new Date(now - 3600000 * 8).toISOString(),
      createdAt: new Date(now - 86400000 * 5).toISOString(),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-001',
      action: 'SESSION_START',
      severity: 'info',
      apiKeyId: 'key-admin-01',
      apiKeyName: 'Master Admin Token',
      sessionId: 'session-primary',
      sessionName: 'Sales & Customer Care',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Vite Browser)',
      method: 'POST',
      path: '/api/sessions/session-primary/start',
      statusCode: 200,
      errorMessage: null,
      metadata: { engine: 'baileys', multiDevice: true },
      createdAt: new Date(now - 3600000 * 18).toISOString(),
    },
    {
      id: 'audit-002',
      action: 'MESSAGE_SEND',
      severity: 'info',
      apiKeyId: 'key-operator-01',
      apiKeyName: 'CRM Messaging Operator',
      sessionId: 'session-primary',
      sessionName: 'Sales & Customer Care',
      ipAddress: '192.168.1.104',
      userAgent: 'OpenWA-SDK/Python',
      method: 'POST',
      path: '/api/sessions/session-primary/messages/send-text',
      statusCode: 200,
      errorMessage: null,
      metadata: { recipient: '14155550192@c.us', messageLength: 68 },
      createdAt: new Date(now - 3600000 * 1.9).toISOString(),
    },
    {
      id: 'audit-003',
      action: 'WEBHOOK_DELIVERY_SUCCESS',
      severity: 'info',
      apiKeyId: null,
      apiKeyName: null,
      sessionId: 'session-primary',
      sessionName: 'Sales & Customer Care',
      ipAddress: '127.0.0.1',
      userAgent: 'OpenWA-Webhook-Dispatcher',
      method: 'POST',
      path: '/api/webhooks/wh-crm-01/test',
      statusCode: 200,
      errorMessage: null,
      metadata: { event: 'message.received', durationMs: 142 },
      createdAt: new Date(now - 60000 * 2).toISOString(),
    },
  ];

  return {
    sessions,
    sessionConfigs,
    sessionProxies,
    chats: { 'session-primary': primaryChats },
    messages,
    contacts: { 'session-primary': primaryContacts },
    groups: { 'session-primary': primaryGroups },
    channels: {
      'session-primary': [
        {
          id: '120363198765432101@newsletter',
          name: 'WhatsApp Beta News',
          description: 'Official WhatsApp features and release announcements',
          subscriberCount: 245000,
          verified: true,
          createdAt: Math.floor((now - 86400000 * 100) / 1000),
        },
      ],
    },
    statusUpdates: {
      'session-primary': [
        {
          id: 'status-01',
          contact: { id: '14155550192@c.us', name: 'Alice Henderson', pushName: 'Alice' },
          type: 'text',
          caption: 'Excited about our upcoming product launch! 🚀',
          backgroundColor: '#25D366',
          timestamp: new Date(now - 3600000 * 4).toISOString(),
          expiresAt: new Date(now + 3600000 * 20).toISOString(),
        },
      ],
    },
    webhooks,
    templates,
    apiKeys,
    auditLogs,
  };
}

class MockDataStore {
  private state: MockState;

  constructor() {
    this.state = this.load();
  }

  private load(): MockState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage read errors
    }
    const initial = getInitialState();
    this.save(initial);
    return initial;
  }

  private save(state: MockState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }

  public getState(): MockState {
    return this.state;
  }

  public updateState(updater: (prev: MockState) => MockState): MockState {
    this.state = updater(this.state);
    this.save(this.state);
    return this.state;
  }

  public reset() {
    this.state = getInitialState();
    this.save(this.state);
  }
}

export const mockStore = new MockDataStore();

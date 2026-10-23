# OpenWA WhatsApp Gateway - React Application

A modern, responsive React web application and management dashboard for **OpenWA** (Open Source WhatsApp Web & Multi-Session API Gateway).

## ✨ Features

- **Real-Time WhatsApp Messaging**: Live chat threads with WhatsApp-like experience including read receipts, participant indicators, text, media, location, stickers, and interactive polls.
- **Multi-Session Lifecycle Management**:
  - View live status of connected sessions, memory utilization, and active engines (Baileys & WhatsApp-Web.js).
  - Scan interactive QR codes for session authentication.
  - Generate 8-digit phone pairing codes.
  - Restart, stop, delete, and manage session configurations.
- **Message Tester**: Test sending messages directly with payload previews, bulk dispatches, and quick recipient selection.
- **Number Checker**: Verify if contact numbers are registered WhatsApp accounts.
- **Webhook Management**: Create, edit, and test webhooks with delivery status simulation and granular filter conditions.
- **Message Templates**: Manage customizable notification templates with parameter placeholders (e.g., `{{1}}`, `{{name}}`).
- **Access Control & Scoped API Keys**: Manage Admin, Operator, and Viewer API keys with session-scoped and chat-scoped permissions.
- **Audit & Activity Logs**: Filterable security and event logs with severity levels, timestamps, and caller details.
- **Infrastructure & Health**: Monitor backend status, database engine, Redis cache connection, and storage backends.
- **Internationalization (i18n)**: Multilingual support with 15+ languages and automatic Right-to-Left (RTL) layout switching (Hebrew, Arabic).
- **Theme Support**: Seamless Dark Mode, Light Mode, and System Theme preferences.

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite
- **Routing**: React Router 7
- **Data Fetching & State**: TanStack React Query
- **Icons**: Lucide React
- **Internationalization**: i18next & react-i18next
- **Data Visualization**: Recharts

## 🚀 Getting Started

Start the development server on port 3000:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

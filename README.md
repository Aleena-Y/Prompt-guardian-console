# AI Security & Prompt Monitoring Dashboard
<img width="1309" height="747" alt="image" src="https://github.com/user-attachments/assets/05902d9a-9ba1-451b-926f-6c520cd0bc90" />

A comprehensive React-based dashboard for monitoring, analyzing, and managing AI prompt security and detection systems.

## Features

- **Prompt Playground** - Test and experiment with AI prompts in real-time
- **Detection Analysis** - Analyze security threats and prompt injection attempts
- **Prompt Logs** - View and monitor historical prompt data
- **Monitoring Dashboard** - Real-time monitoring of system metrics and alerts
- **Security Policies** - Configure and manage security rules and policies

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Notifications**: Sonner + Custom Toaster

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd lovable-project-f597009a-f8b3-46d5-b81c-30bc5af815b7-2026-02-01

# Install dependencies
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Building for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components
│   └── ui/              # Reusable UI components
├── pages/               # Page components
│   ├── PromptPlayground.tsx
│   ├── DetectionAnalysis.tsx
│   ├── PromptLogs.tsx
│   ├── MonitoringDashboard.tsx
│   ├── SecurityPolicies.tsx
│   └── NotFound.tsx
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Available Routes

- `/` - Prompt Playground
- `/analysis` - Detection Analysis
- `/logs` - Prompt Logs
- `/monitoring` - Monitoring Dashboard
- `/policies` - Security Policies

## License

[Your License Here]

## Contributing

[Contributing Guidelines]

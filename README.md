# Seatherder

Event seating management application that simplifies event organization through automated table assignments and guest check-ins.

## Features

- **Guest Management**: Import guests via CSV/Excel, bulk paste, or manual entry
- **Intelligent Table Assignments**: Randomized seating with department-mixing algorithm
- **Multi-Round Events**: Support for 1-10 rounds with configurable durations
- **Guest Check-In**: Name search and QR code scanning
- **QR Code Generation**: Personal QR codes for each guest and table
- **Event Theming**: 7+ preset themes with full custom color support
- **Real-time Timer**: Round countdown with pause/resume and audio alerts

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Backend**: Convex (serverless database + real-time sync)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account (free tier available at [convex.dev](https://convex.dev))

### Installation

```bash
# Install dependencies
npm install

# Set up Convex (follow prompts to create/link project)
npx convex dev
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Or run separately:
npm run dev:frontend  # Next.js on localhost:3000
npm run dev:backend   # Convex dev server
```

### Build

```bash
npm run build         # Local build
npm run build:vercel  # Vercel deployment (deploys Convex first)
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard (protected)
│   ├── event/[id]/         # Event management
│   ├── checkin/            # Guest check-in search
│   ├── scan/[qrCodeId]/    # QR code handler
│   └── timer/[eventId]/    # Round timer display
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── feature/            # Feature-specific components
└── lib/                    # Utilities and types

convex/
├── schema.ts               # Database schema
├── events.ts               # Event mutations/queries
└── guests.ts               # Guest mutations/queries
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development (frontend + backend) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run kill` | Kill all dev processes |
| `npm run linecount` | Count lines of code |

## Environment Variables

Create a `.env.local` file:

```env
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## License

Private - All rights reserved

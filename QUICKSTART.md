# Safe by Design: Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+ and npm installed
- Modern browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# 1. Extract the archive (if using .tar.gz)
tar -xzf safe-by-design.tar.gz
cd safe-by-design

# 2. Install all dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
cd shared && npm install && cd ..

# 3. Initialize the database
npm run setup

# 4. Start the application
npm run dev
```

The application will start on:
- **Client (Teams & Facilitator)**: http://localhost:5173
- **Server (API)**: http://localhost:3001

## 🎮 First Game

### For Facilitators:

1. Navigate to http://localhost:5173
2. Click "Create New Game"
3. Select number of teams (3-6)
4. Share the generated **Game Code** with teams
5. Click "Join as Facilitator" and enter the same code
6. Wait for teams to join
7. Start Cycle 1 when ready

### For Teams:

1. Navigate to http://localhost:5173
2. Click "Join Game"
3. Enter the **Game Code** from facilitator
4. Enter your **Team Name**
5. Optionally select roles (Diabetes Specialist, Clinical Lead, etc.)
6. Click "Join Game"

## 📱 Game Flow

Each cycle follows this pattern:

1. **Facilitator starts cycle** → Brief appears for all teams
2. **Teams make decisions** → Allocate budgets across 3 categories
3. **Facilitator closes submissions** → System calculates results
4. **Results displayed** → Teams see their 4 pillar scores
5. **Facilitator reviews prompts** → Automated debrief questions appear
6. **Facilitator advances** → Move to next cycle or end game

## 🎯 Decision Budgets

Each cycle, teams have:
- **10 Capacity Points** (clinic slots, appointments)
- **10 Staff Energy** (bandwidth for change/new initiatives)
- **10 Cash Budget** (money for tech, locums, etc.)

## 📊 Four Pillars (Scoring)

Teams are scored on:
1. **Safety & Outcomes** (Blue) - Clinical safety metrics
2. **Equity & Access** (Purple) - Fair access for all populations
3. **Staff Sustainability** (Green) - Staff wellbeing and retention
4. **System Resilience** (Amber) - Financial and operational stability

**You can't win all four!** The game forces trade-offs.

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database
rm server/data/game.db
npm run setup
```

### Port Already in Use
```bash
# Edit server/.env
PORT=3002  # Change from 3001

# Edit client/vite.config.ts
server: { port: 5174 }  # Change from 5173
```

### Dependencies Won't Install
```bash
# Use legacy peer deps
npm install --legacy-peer-deps
```

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules */node_modules
npm install
```

## 📚 Advanced Features

### Automated Facilitation Prompts

The facilitator view automatically generates:
- **What Happened** summaries for each team
- **Notable Trade-offs** detected from decisions
- **Coaching Questions** (6-10 per team)
- **Role-Targeted Prompts** for each perspective:
  - Diabetes Specialist Midwife
  - Clinical Lead
  - Workforce/Capacity Lead
  - Service/Pathway Lead

### Prompt Pinning

1. Click any prompt to "pin" it
2. Pinned prompts appear in your debrief running order
3. Export pinned prompts to PDF or copy to clipboard

### Viewing Results History

- Results tab shows cycle-by-cycle comparison
- Charts show pillar trends over time
- Incident log shows all safety events

## 🚢 Deployment

### Option 1: Single Server

```bash
# Build for production
npm run build

# Serve with Node
cd server
npm start

# Access at http://your-server:3001
```

### Option 2: Separate Hosting

**Client (Static Host like Vercel, Netlify)**:
```bash
cd client
npm run build
# Upload dist/ folder
```

**Server (Node.js host like Render, Railway)**:
```bash
cd server
npm run build
npm start
```

Set environment variables:
- Server: `CLIENT_URL=https://your-client-domain.com`
- Client: `VITE_API_URL=https://your-server-domain.com`

## 🎨 Customization

### Change Theme Colors

Edit `client/src/index.css`:
```css
:root {
  --primary-500: #your-color;
  --accent-500: #your-color;
}
```

### Add/Modify Decisions

Edit `server/src/data/decisions.json`

### Modify Cycle Briefs

Edit `server/src/data/cycleBriefs.json`

### Customize Prompts

Edit `server/src/data/promptBank.json`

## 📞 Support

For issues or questions:
1. Check the full README.md
2. Review the /docs folder
3. Examine /tests for examples

## 🎓 Learning Objectives

This simulation teaches:
- **Systems thinking** in healthcare
- **Trade-off management** under resource constraints
- **Multi-stakeholder perspectives**
- **Data-driven decision making**
- **Equity and safety balance**

Good luck running your first session! 🎉

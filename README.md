# Safe by Design: Managing a Maternity System Under Pressure

A production-ready business simulation game for midwives and specialist midwives, designed for face-to-face facilitation with real-time multiplayer decision-making.

## 🎯 Overview

Safe by Design is a 6-cycle simulation where teams manage a diabetes midwifery service under increasing pressure. Teams must balance four critical pillars:

- **Safety & Outcomes** - Clinical quality and incident prevention
- **Equity & Access** - Fair distribution of care
- **Staff Sustainability** - Workforce wellbeing and retention
- **System Resilience** - Long-term service sustainability

### Key Features

✨ **Real-time Multiplayer** - WebSocket-powered synchronization across all devices  
🎮 **6 Cycles** - Progression from booking through postnatal with escalating pressure  
🎯 **Resource Management** - Teams allocate limited budgets (Capacity, Staff Energy, Cash)  
📊 **Automated Scoring** - Transparent calculations with immediate feedback  
🗣️ **Facilitation Engine** - 80+ automated coaching prompts based on team decisions  
📈 **Live Dashboard** - Facilitator control room with real-time team progress  
🎨 **Premium UI** - Clean, professional interface with healthcare aesthetic

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone or extract the project**:
```bash
cd safe-by-design
```

2. **Install dependencies**:
```bash
npm run install:all
```

3. **Initialize the database**:
```bash
npm run setup
```

4. **Start the application**:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend client on `http://localhost:5173`

5. **Open your browser**:
Navigate to `http://localhost:5173`

---

## 📖 How to Use

### For Facilitators

1. **Create a Game**:
   - Click "Facilitator" on the home page
   - Select number of teams (3-6)
   - Optional: Enter your name
   - Click "Create Game"
   - You'll receive a 6-character game code

2. **Share the Code**:
   - Display the game code for teams to join
   - You can copy it to clipboard from the facilitator dashboard

3. **Run the Session**:
   - **Lobby**: Wait for all teams to join
   - **Start Cycle**: Begin each cycle when ready
   - **Monitor Submissions**: Track which teams have submitted decisions
   - **Close Submissions**: Calculate results when all teams are ready
   - **Review Results**: Use the automated prompts to facilitate discussion
   - **Advance Cycle**: Move to the next cycle

4. **Use Facilitation Tools**:
   - The system generates context-aware coaching questions
   - Prompts adapt based on team decisions and outcomes
   - Compare teams side-by-side
   - Export session reports

### For Teams

1. **Join a Game**:
   - Click "Join as Team" on the home page
   - Enter the 6-character game code from your facilitator
   - Choose a team name
   - Click "Join Game"

2. **Make Decisions Each Cycle**:
   - Read the cycle brief carefully
   - Review available decisions across 4 categories:
     - Pathway & Access
     - Clinical Safety & Governance
     - Digital & Monitoring
     - Workforce & Wellbeing
   - Select decisions within your three budgets:
     - **Capacity Points** (10) - Service capacity
     - **Staff Energy** (10) - Team workload
     - **Cash Budget** (10) - Financial resources
   - Submit when ready

3. **Review Results**:
   - See your scores across all four pillars
   - Review any incidents that occurred
   - Reflect on trade-offs made
   - Wait for facilitator to advance

---

## 🏗️ Architecture

### Technology Stack

**Backend**:
- Node.js + TypeScript
- Express.js (REST API)
- Socket.IO (Real-time WebSockets)
- SQLite (Database)
- Seedrandom (Reproducible randomness)

**Frontend**:
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- React Router (Navigation)
- Recharts (Data visualization)
- Lucide React (Icons)

### Project Structure

```
safe-by-design/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Main views (Home, Facilitator, Team)
│   │   ├── components/    # Reusable components
│   │   ├── utils/         # Socket connection
│   │   └── main.tsx       # Entry point
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── engine/        # Game logic & prompt generation
│   │   ├── data/          # Seed data (decisions, briefs, prompts)
│   │   ├── scripts/       # Setup scripts
│   │   ├── database.ts    # SQLite setup
│   │   └── index.ts       # Server entry point
│   └── package.json
│
├── shared/                 # Shared TypeScript types
│   └── src/index.ts
│
└── package.json           # Root workspace config
```

---

## 🎮 Game Mechanics

### Decision Model

Each cycle, teams select from 14 decision options:

1. **Pathway & Access** (5 options)
   - Expand capacity, group education, triage, outreach, interpreters

2. **Clinical Safety** (3 options)
   - Escalation audits, standardized guidelines, incident reviews

3. **Digital & Monitoring** (3 options)
   - Remote monitoring, SMS reminders, telehealth

4. **Workforce** (3 options)
   - Protected learning time, bank/agency cover, wellbeing support

Each decision has:
- **Costs** in one or more budgets
- **Effect tags** (safety, equity, staff, flow, resilience)
- **Timing** (immediate, delayed, or both)

### Scoring System

Scores are calculated using:
- **Base values** that decrease with pressure over cycles
- **Decision effects** (immediate and delayed)
- **Trade-offs** (e.g., triage improves safety but reduces equity)
- **Seeded randomness** (reproducible per team/cycle)

The game engine implements realistic healthcare pressures:
- Backlogs increase
- DNA rates rise
- Staff sickness grows
- Incidents occur based on decisions

### Prompt Engine

The automated facilitation system:
1. Analyzes team decisions and outcomes
2. Detects notable patterns (trade-offs, imbalances, divergences)
3. Selects relevant prompts from 80+ template bank
4. Generates role-specific questions
5. Provides plenary discussion starters

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```bash
PORT=3001
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the client directory:

```bash
VITE_SOCKET_URL=http://localhost:3001
```

### Database

SQLite database is created at `server/game.db` on first run.

To reset the database:
```bash
rm server/game.db
npm run setup
```

---

## 📦 Deployment

### Build for Production

```bash
npm run build
```

This creates:
- `client/dist` - Static frontend files
- `server/dist` - Compiled TypeScript backend

### Deployment Options

**Option 1: Single Server (Recommended)**
- Deploy both client and server to a single host
- Serve client static files from Express
- Use a reverse proxy (nginx) for production

**Option 2: Separate Deployments**
- Deploy client to Vercel/Netlify
- Deploy server to Render/Railway/Heroku
- Update CORS and environment variables

**Option 3: Docker** (create Dockerfile):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm run install:all
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 🧪 Testing

The project includes a test suite for the prompt selection engine:

```bash
cd server
npm test
```

---

## 📊 Data & Content

### Cycle Briefs

6 realistic scenarios covering the maternity care pathway:
1. **Booking Wave** - Service establishment
2. **Antenatal Surge** - Capacity strain
3. **Intrapartum Pressure** - Escalation surge
4. **Postnatal Gap** - Hidden vulnerabilities
5. **Winter Pressure** - System at breaking point
6. **Recovery** - Rebuilding for the future

### Decision Options

14 evidence-informed interventions across 4 categories, each with:
- Realistic costs
- Multiple effect tags
- Timing considerations
- Trade-off implications

### Prompt Bank

80+ facilitation prompts organized by:
- **Trigger conditions** (safety drop, burnout, equity issues)
- **Categories** (plenary, team-specific, role-lens)
- **Roles** (diabetes specialist, clinical lead, workforce, pathway)

---

## 🎨 Design Philosophy

The interface uses a **clinical excellence meets modern design** aesthetic:

- **Calming but purposeful** color palette (teal/cyan healthcare colors)
- **Premium typography** (Plus Jakarta Sans display, Inter body)
- **Data-first** visualizations
- **Accessible** color contrast and clear hierarchy
- **Professional** without being corporate

---

## 🛠️ Development

### Scripts

```bash
npm run dev           # Start dev servers (client + server)
npm run dev:server    # Start server only
npm run dev:client    # Start client only
npm run build         # Build for production
npm start             # Run production build
npm run setup         # Initialize database
```

### Adding New Content

**New Decision**:
Edit `server/src/data/decisions.json`

**New Cycle Brief**:
Edit `server/src/data/cycleBriefs.json`

**New Prompts**:
Edit `server/src/data/promptBank.json`

---

## 📝 License

This project is provided for educational and training purposes.

---

## 🤝 Support

For issues or questions:
1. Check this README thoroughly
2. Review the code comments
3. Test with the setup script
4. Check browser console for errors

---

## 🎓 Educational Use

This simulation is designed for:
- Specialist midwife training programs
- Clinical leadership development
- Service improvement workshops
- Quality and safety education
- Interprofessional learning

**Learning Objectives**:
- Understand system pressures in maternity services
- Practice resource allocation under constraints
- Recognize trade-offs between competing priorities
- Develop systems thinking
- Improve team decision-making

---

## 🚀 Future Enhancements

Potential additions:
- PDF report generation
- Historical data visualization
- User authentication
- Multiple concurrent games
- Custom scenario builder
- Integration with learning management systems

---

## 📋 Troubleshooting

**Port already in use**:
```bash
# Change ports in .env files or:
lsof -ti:3001 | xargs kill
```

**Database locked**:
```bash
rm server/game.db
npm run setup
```

**Socket connection failed**:
- Check firewall settings
- Ensure backend is running
- Verify VITE_SOCKET_URL in client .env

**Teams can't join**:
- Verify game code is correct (6 characters, uppercase)
- Check game status (should be 'lobby')
- Ensure team capacity not exceeded

---

**Built with care for midwives managing complexity under pressure** 💙
#   s a f e - b y - d e s i g n  
 
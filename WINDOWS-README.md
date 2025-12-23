# Safe by Design - Windows JSON Version

## ✅ This Version Uses JSON Files (No SQLite!)

This version has been rebuilt to use **JSON file storage** instead of SQLite, which means:
- ✅ **No compilation needed** - works on any Node.js version
- ✅ **No Visual Studio required** - pure JavaScript
- ✅ **Works on Windows immediately** - no build tools needed
- ✅ **Same functionality** - all features work exactly the same

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```powershell
# From the safe-by-design folder
cd C:\Users\ChrisFreebairn\Downloads\files\safe-by-design

# Install root
npm install

# Install shared
cd shared
npm install
cd ..

# Install server  
cd server
npm install
cd ..

# Install client
cd client
npm install
cd ..
```

### Step 2: Build Shared Types

```powershell
cd shared
npm run build
cd ..
```

### Step 3: Initialize JSON Database

```powershell
npm run setup
```

**You should see:**
```
✓ JSON database initialized successfully
✓ Data files created
✓ Storage ready
```

### Step 4: Start the Application

```powershell
npm run dev
```

**You should see:**
```
[server] JSON database initialized
[server] Server running on port 3001
[client] ➜  Local:   http://localhost:5173/
```

### Step 5: Open Browser

Go to: **http://localhost:5173**

**Done!** 🎉

---

## 📁 How Data Storage Works

Instead of a SQLite database file, this version stores data in JSON files:

```
server/data/
├── games.json           # All games
├── teams.json           # All teams
├── team_decisions.json  # All team decisions
└── cycle_results.json   # All results
```

### Advantages:
- ✅ Human-readable - you can open and view the files
- ✅ No compilation required
- ✅ Works on any platform
- ✅ Easy to backup (just copy the data folder)
- ✅ Easy to reset (just delete the JSON files)

### Limitations:
- ⚠️ Not suitable for 100+ concurrent games (but perfect for 1-20)
- ⚠️ Files grow with data (but still very small)

For your use case (classroom/workshop sessions), this is perfect!

---

## 🔄 Resetting Data

To clear all games and start fresh:

```powershell
# Stop the server (Ctrl+C)

# Delete data files
Remove-Item server\data\*.json

# Reinitialize
npm run setup

# Start again
npm run dev
```

---

## 🎮 Testing Your Setup

### Create a Test Game:

1. **Open browser:** http://localhost:5173
2. **Click:** "Create New Game"
3. **Select:** 4 teams
4. **Click:** "Create Game"
5. **Copy the game code** (e.g., "ABC123")
6. **Click:** "Join as Facilitator"
7. **Enter the game code**

### Join as a Team:

1. **Open new tab:** http://localhost:5173
2. **Click:** "Join Game"
3. **Enter the game code**
4. **Enter team name:** "Test Team"
5. **Click:** "Join Game"

### Run a Cycle:

1. **Facilitator tab:** Click "Start Cycle 1"
2. **Team tab:** Select some decisions → Click "Submit Decisions"
3. **Facilitator tab:** Click "Close Submissions & Calculate"
4. **See results!** Scores, metrics, and automated prompts

---

## ❓ Troubleshooting

### "Cannot find module 'express'"
**Solution:** Run `cd server && npm install && cd ..`

### Port 5173 or 3001 already in use
**Solution:**
```powershell
# Find and kill process on Windows
netstat -ano | findstr :5173
# Note the PID, then:
taskkill /PID <PID> /F
```

### Changes not appearing
**Solution:**
```powershell
# Rebuild shared types
cd shared
npm run build
cd ..

# Restart server
# (Ctrl+C to stop, then npm run dev)
```

### Data seems corrupted
**Solution:**
```powershell
# Reset database
Remove-Item server\data\*.json
npm run setup
```

---

## 📊 Viewing Game Data

You can open the JSON files in any text editor to see the data:

```powershell
# View all games
notepad server\data\games.json

# View all teams
notepad server\data\teams.json

# View results
notepad server\data\cycle_results.json
```

---

## 🚢 Deployment

### For Production Use:

If you want to deploy this to a real server:

1. **Build everything:**
   ```powershell
   npm run build
   ```

2. **Copy these folders to your server:**
   - `server/dist/`
   - `server/data/`
   - `server/package.json`
   - `client/dist/`

3. **On server, run:**
   ```bash
   cd server
   npm install --production
   npm start
   ```

---

## 💾 Backing Up Your Games

To save your game data:

```powershell
# Create backup
mkdir backups
copy server\data\*.json backups\

# Restore from backup
copy backups\*.json server\data\
```

---

## ✅ What's Different from the Original?

**Changed:**
- ❌ SQLite database → ✅ JSON file storage
- ❌ better-sqlite3 package → ✅ Built-in fs module
- ❌ Needs compilation → ✅ Pure JavaScript

**Exactly the Same:**
- ✅ All game features
- ✅ Real-time updates
- ✅ Automated prompts
- ✅ Team management
- ✅ Scoring system
- ✅ UI/UX
- ✅ Performance (for normal use)

---

## 🎉 You're Ready!

This version is specifically built for Windows and will work immediately without any build tool installation. 

Run `npm run dev` and start facilitating your first session!

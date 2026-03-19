# JEE Prep Application

A comprehensive full-stack JEE preparation application with React frontend, Node.js/Express backend, and MongoDB database.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + React Router
- **Backend**: Node.js + Express (ESM modules)
- **Database**: MongoDB (via Docker)
- **Video**: HTML5 video (local) + react-youtube (YouTube)

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

## Setup Instructions

### 1. Start MongoDB

```bash
cd /opt/ramprasad/palugula/projects/jeeapp
docker compose up -d
```

Wait a few seconds for MongoDB to initialize, then verify:
```bash
docker compose ps
```

### 2. Install Backend Dependencies

```bash
cd /opt/ramprasad/palugula/projects/jeeapp/backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd /opt/ramprasad/palugula/projects/jeeapp/frontend
npm install
```

### 4. Start the Backend

```bash
cd /opt/ramprasad/palugula/projects/jeeapp/backend
npm run dev
```

The backend will:
- Connect to MongoDB
- Auto-scan the study-content directory
- Start on http://localhost:5000

### 5. Start the Frontend

In a new terminal:
```bash
cd /opt/ramprasad/palugula/projects/jeeapp/frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Adding Study Content

### File System Structure

Place your study materials in this structure:
```
study-content/
  Maths/
    Chapter 1 - Sets/
      Lectures/     <- Place .mp4, .mkv, .webm, .avi, .mov files here
      Notes/        <- Place .pdf, .docx, .pptx files here
      Worksheets/   <- Place .pdf, .docx files here
    Chapter 2 - Relations/
      ...
  Physics/
    Chapter 1 - Physical World/
      ...
  Chemistry/
    ...
```

After adding files, go to **Settings** and click **Rescan All Files**, or use the **Rescan Files** button on each subject page.

### YouTube Videos

On any subject page, expand a chapter and click the **+** button to add a YouTube video URL. The app will fetch the video title automatically.

## Features

### Dashboard
- Profile picture and banner image (upload in Settings)
- JEE exam countdown timer (set exam date in Settings)
- Subject progress cards
- Study activity heatmap (GitHub-style, last 12 weeks)
- Recent activity feed
- Quick navigation links

### Subject Pages
- Chapter list with drag-to-reorder (up/down buttons)
- Expandable chapters showing Lectures, Notes, Worksheets
- Per-item completion tracking
- Add YouTube videos to any chapter
- Rescan file system

### Chapter Pages
- Chapter metadata form (Eisenhower label, confidence, reference book, etc.)
- Full video player with progress saving
- Document viewer
- Item reordering

### Video Player
- **Local videos**: HTML5 player with custom controls, range-request streaming
- **YouTube videos**: Embedded YouTube player
- Progress saved to MongoDB every 5 seconds
- Resumes from last watched position automatically
- Auto-marks as complete when 90%+ watched

### Analytics
- Total study hours tracked
- Videos and PDFs completed
- Per-subject breakdown
- Chapter completion grid
- Study heatmap

### Weekly Plan
- Week navigation (previous/next week)
- Add study tasks to any day
- Estimated time per task
- Mark tasks as done

### Settings
- Upload profile picture
- Upload dashboard banner
- Set display name
- Set JEE exam date
- Full file system rescan

## Environment Variables

Backend `.env`:
```
PORT=5000
MONGODB_URI=mongodb://jeeapp:jeeapp123@localhost:27017/jeeapp?authSource=admin
STUDY_CONTENT_PATH=/opt/ramprasad/palugula/projects/jeeapp/study-content
UPLOADS_PATH=/opt/ramprasad/palugula/projects/jeeapp/uploads
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/subjects | List all subjects with stats |
| GET | /api/subjects/:subject/chapters | List chapters for subject |
| POST | /api/subjects/:subject/scan | Rescan subject directory |
| GET | /api/chapters/:id | Get chapter details |
| PUT | /api/chapters/:id | Update chapter metadata |
| POST | /api/chapters/:subject/reorder | Reorder chapters |
| GET | /api/chapters/:id/items | Get chapter items |
| POST | /api/chapters/:id/items/youtube | Add YouTube video |
| POST | /api/chapters/:id/items/reorder | Reorder items |
| PUT | /api/items/:id/progress | Update video progress |
| PUT | /api/items/:id/complete | Toggle completion |
| GET | /api/analytics | Full analytics data |
| GET | /api/analytics/heatmap | Heatmap data |
| GET | /api/analytics/recent | Recent activity |
| GET | /api/weekly-plan | Current week plan |
| GET | /api/weekly-plan/:weekStart | Specific week plan |
| PUT | /api/weekly-plan/:weekStart | Save week plan |
| GET | /api/settings | Get all settings |
| PUT | /api/settings/:key | Update a setting |
| POST | /api/settings/profile-pic | Upload profile picture |
| POST | /api/settings/banner | Upload banner image |
| POST | /api/settings/rescan | Rescan all files |
| GET | /api/files/video/:path | Stream local video |
| GET | /api/files/document/:path | Serve document |

## MongoDB Admin

Access MongoDB Express at http://localhost:8081
- Username: admin
- Password: admin123

## Color Theme

The application uses a consistent dark theme:
- Background: `#0B0C10`
- Card: `#161B22`
- Primary: `#6366F1` (Indigo)
- Text: `#E2E8F0`

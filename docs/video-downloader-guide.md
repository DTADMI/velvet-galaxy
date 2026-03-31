# VidNexus - Universal Video Downloader

> **VidNexus**: Where videos meet convenience. A powerful, cross-platform solution for all your video downloading needs.

## Table of Contents
1. [Project Overview](#overview)
2. [Repository Structure](#repository-structure)
3. [Hosting & Deployment](#hosting--deployment)
4. [Cost Analysis](#cost-analysis)
5. [Installation & Setup](#installation--setup)
6. [Configuration](#configuration)
7. [Workflows](#workflows)
8. [Usage Scenarios](#usage-scenarios)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)
11. [Legal Considerations](#legal-considerations)

## Table of Contents
1. [Project Overview](#overview)
2. [Project Structure](#project-structure)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Workflows](#workflows)
6. [Usage Scenarios](#usage-scenarios)
7. [Input/Output Specifications](#inputoutput-specifications)
8. [API Reference](#api-reference)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [Legal Considerations](#legal-considerations)

## Overview
A comprehensive video downloading solution that supports multiple platforms and formats, with both web and desktop interfaces.

## Overview
A comprehensive video downloading solution that supports multiple platforms and formats, with both web and desktop interfaces.

## Tech Stack

### Core Components
- **Backend**: Python 3.9+
  - `pytube` - For YouTube downloads
  - `yt-dlp` - For broader website support (successor to youtube-dl)
  - `fastapi` - For web API
  - `uvicorn` - ASGI server
  - `selenium` - For sites with heavy JavaScript
  - `ffmpeg` - For video processing and format conversion

### Frontend Options

#### Option 1: Web Interface
- **Frontend**: React.js with TypeScript
- **UI Framework**: MUI (Material-UI) or Chakra UI
- **State Management**: React Query + Zustand
- **Bundler**: Vite

#### Option 2: Desktop Application
- **Framework**: PyQt6 or Tkinter (Python)
- **Alternative**: Electron.js (JavaScript/TypeScript)
- **Packaging**: PyInstaller or Py2App/Py2Exe

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions or GitLab CI
- **Hosting**: 
  - Web: Vercel/Netlify (frontend) + Render/Railway (backend)
  - Desktop: GitHub Releases, Homebrew, Chocolatey, Snapcraft

## Desktop-First Solution

### Why Choose Desktop?
1. **Performance**
   - Direct hardware access
   - Multi-threaded processing
   - No browser limitations
   - Efficient large file handling

2. **User Experience**
   - Native system integration
   - System tray support
   - Global hotkeys
   - Drag-and-drop functionality
   - Background processing

3. **Technical Advantages**
   - No CORS restrictions
   - Direct file system access
   - Better memory management
   - No server costs for basic functionality

### Recommended Tech Stack
- **Framework**: Tauri (Rust-based, smaller footprint than Electron)
- **Frontend**: Svelte + TypeScript
- **Backend**: Rust (for performance-critical operations)
- **Database**: SQLite (local storage)
- **Packaging**:
  - Windows: MSI/NSIS
  - macOS: DMG
  - Linux: AppImage/Flatpak

## Repository Structure

### Desktop-Only Structure
```
vidnexus-desktop/
├── src-tauri/           # Tauri configuration
│   ├── src/
│   │   └── main.rs      # Rust backend
│   └── tauri.conf.json
├── src/
│   ├── lib/            # Shared utilities
│   ├── components/      # UI components
│   ├── stores/         # State management
│   └── App.svelte      # Main application
├── public/             # Static assets
└── package.json
```

### Monorepo vs. Polyrepo Analysis

#### Monorepo Approach (Recommended)
```
vidnexus/
├── apps/
│   ├── web/           # React frontend
│   ├── api/           # FastAPI backend
│   └── desktop/       # Electron desktop app
├── packages/
│   ├── core/          # Shared business logic
│   ├── ui/            # Shared UI components
│   └── types/         # Shared TypeScript types
└── tools/             # Shared tooling and scripts
```

**Advantages**:
- Shared code between web and desktop
- Atomic commits across all components
- Simplified dependency management
- Unified CI/CD pipeline

**Disadvantages**:
- Larger repository size
- Requires proper access controls
- Build times can increase

#### Polyrepo Alternative
```
vidnexus-web/          # Separate repo for web frontend
vidnexus-api/          # Separate repo for backend
vidnexus-desktop/      # Separate repo for desktop app
vidnexus-shared/       # Shared code as a package
```

**When to choose polyrepo**:
- Teams working independently
- Different release cycles
- Strict access control needs

## Desktop Distribution & Updates

### Packaging
1. **Windows**
   - MSI installer with auto-update
   - Chocolatey package
   - Silent install options

2. **macOS**
   - Signed DMG package
   - Homebrew cask
   - Notarization for Gatekeeper

3. **Linux**
   - AppImage for universal compatibility
   - Flatpak for sandboxing
   - .deb/.rpm packages

### Update System
- **Tauri's Built-in Updater**
  - Delta updates (smaller downloads)
  - Signature verification
  - Release channels (stable/beta)
  - Silent background updates

### Offline Support
- Full functionality without internet
- Local queue management
- Scheduled downloads
- Resume interrupted downloads

### Database Technology Comparison

#### Supabase vs Convex

| Feature | Supabase | Convex | Recommendation |
|---------|----------|--------|----------------|
| **Type** | PostgreSQL + Realtime | Custom Document DB | **Supabase** for SQL needs, **Convex** for realtime |
| **Pricing** | Generous free tier | Free tier + usage-based | **Supabase** for cost-effectiveness |
| **Realtime** | WebSockets | Built-in realtime | **Convex** for realtime features |
| **Scalability** | Scales well | Auto-scales | **Tie** |
| **Local Dev** | Docker support | Built-in local dev | **Tie** |
| **Best for** | Complex queries | Real-time apps | **Supabase** (general), **Convex** (realtime-heavy) |

#### Recommended Stack

**Development & Staging**
- **Frontend**: Vercel (Free tier)
- **Backend**: Railway.app ($5-20/month)
- **Database**: Supabase (Free tier for most use cases)
- **Storage**: Cloudflare R2 ($0.015/GB/month)
- **Realtime**: Supabase Realtime or Convex (if realtime is critical)

#### Production (10k+ MAU)
- **Frontend**: Cloudflare Pages
- **Backend**: AWS ECS Fargate (~$30/month)
- **Database**: AWS RDS PostgreSQL (~$15/month)
- **Storage**: AWS S3 + CloudFront (~$10/month)
- **CDN**: Cloudflare (Free)

### Cost-Effective Architecture

1. **Serverless First**
   - API Gateway + Lambda for API
   - Edge functions for authentication
   - JAMstack architecture for frontend

2. **Caching Strategy**
   - Redis for session management
   - CDN caching for static assets
   - Browser caching headers

3. **Cost Optimization**
   - Auto-scaling based on demand
   - Scheduled scaling (e.g., reduce capacity at night)
   - Reserved instances for predictable workloads

## Cost Analysis (Desktop Focused)

### Development Costs
| Component | Cost | Notes |
|-----------|------|-------|
| Code Signing | $200-500/year | Required for all platforms |
| Notarization | $99/year | Apple Developer Program |
| Build Infrastructure | $0-50/month | GitHub Actions (free for OSS) |
| Distribution | $0-20/month | Hosting installers |
| **Total (First Year)** | **$300-700** | One-time setup + annual fees |

### User Costs
- **Free Tier**: Basic functionality
- **Pro Version**: One-time purchase or subscription
- **Enterprise**: Custom deployment options

### Cost Optimization
1. Use GitHub Releases for distribution
2. Leverage OSS licenses
3. Community support forums
4. Automated testing pipelines

### Development Costs (Monthly)
| Service | Free Tier | Small Scale | Medium Scale |
|---------|-----------|-------------|--------------|
| Frontend Hosting | $0 | $0-20 | $20-100 |
| Backend Hosting | $0 | $5-20 | $50-200 |
| Database | $0 | $0-10 | $15-50 |
| Storage | $0 | $0-5 | $5-20 |
| CDN/Bandwidth | $0 | $0-10 | $10-50 |
| **Total** | **$0** | **$5-45** | **$100-420** |

### Cost-Saving Tips
1. Use free tiers aggressively
2. Implement rate limiting
3. Optimize media delivery
4. Use edge caching
5. Monitor and analyze usage patterns

```
video-downloader/
├── backend/                  # Backend services
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   ├── config.py        # Configuration settings
│   │   ├── downloader/      # Downloader implementations
│   │   │   ├── __init__.py
│   │   │   ├── base.py      # Base downloader class
│   │   │   ├── youtube.py   # YouTube-specific implementation
│   │   │   └── generic.py   # Generic downloader
│   │   ├── models/          # Data models
│   │   └── utils/           # Utility functions
│   ├── tests/               # Backend tests
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # Web interface
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API services
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
│
├── desktop/                 # Desktop application
│   ├── main.py
│   ├── ui/                  # UI components
│   └── requirements.txt
│
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── .github/                 # CI/CD workflows
├── docker-compose.yml
└── README.md
```

```
video-downloader/
├── backend/                  # Backend services
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   ├── config.py        # Configuration settings
│   │   ├── downloader/      # Downloader implementations
│   │   │   ├── __init__.py
│   │   │   ├── base.py      # Base downloader class
│   │   │   ├── youtube.py   # YouTube-specific implementation
│   │   │   └── generic.py   # Generic downloader
│   │   ├── models/          # Data models
│   │   └── utils/           # Utility functions
│   ├── tests/               # Backend tests
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # Web interface
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API services
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
│
├── desktop/                 # Desktop application
│   ├── main.py
│   ├── ui/                  # UI components
│   └── requirements.txt
│
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── .github/                 # CI/CD workflows
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Core Components
- **Backend**: Python 3.9+
  - `pytube` - For YouTube downloads
  - `yt-dlp` - For broader website support (successor to youtube-dl)
  - `fastapi` - For web API
  - `uvicorn` - ASGI server
  - `selenium` - For sites with heavy JavaScript
  - `ffmpeg` - For video processing and format conversion

### Frontend Options

#### Option 1: Web Interface
- **Frontend**: React.js with TypeScript
- **UI Framework**: MUI (Material-UI) or Chakra UI
- **State Management**: React Query + Zustand
- **Bundler**: Vite

#### Option 2: Desktop Application
- **Framework**: PyQt6 or Tkinter (Python)
- **Alternative**: Electron.js (JavaScript/TypeScript)
- **Packaging**: PyInstaller or Py2App/Py2Exe

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions or GitLab CI
- **Hosting**: 
  - Web: Vercel/Netlify (frontend) + Render/Railway (backend)
  - Desktop: GitHub Releases, Homebrew, Chocolatey, Snapcraft

## Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ (for web frontend)
- FFmpeg
- Chrome/Firefox (for Selenium)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/video-downloader.git
cd video-downloader

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# For web frontend (if applicable)
cd frontend
npm install
```

## Architecture

### Core Components
1. **Download Manager**
   - Handles queue management
   - Concurrent downloads
   - Progress tracking
   - Error handling and retries

2. **Extractor System**
   - Platform-specific extractors
   - Fallback mechanisms
   - Metadata extraction

3. **Format Conversion**
   - Video/audio format conversion
   - Quality selection
   - Bitrate adjustments

4. **User Interface**
   - URL input and parsing
   - Format/quality selection
   - Download queue visualization
   - Settings management

## Implementation Details

### Subscription Site Integration

#### Media Processing Pipeline
1. **Discovery**
   - Profile scanning
   - Content enumeration
   - Metadata extraction

2. **Download**
   - Adaptive bitrate selection
   - Parallel downloads
   - Checksum verification

3. **Post-Processing**
   - Metadata embedding
   - Thumbnail generation
   - File organization

#### Error Handling
- Network failures
- Rate limiting
- Authentication issues
- Corrupt downloads

#### Example: Download Manager
```tsx
function DownloadManager() {
  const { data: queue } = useQuery({
    queryKey: ['downloads'],
    queryFn: fetchDownloadQueue
  });

  const { mutate: addToQueue } = useMutation({
    mutationFn: queueDownload,
    onSuccess: () => {
      queryClient.invalidateQueries(['downloads']);
    }
  });

  return (
    <div className="download-manager">
      <QueueList items={queue} />
      <AddDownloadForm onSubmit={addToQueue} />
    </div>
  );
}
```

### Backend API (FastAPI)
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import yt_dlp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    url: str
    format: Optional[str] = "best"
    output_path: Optional[str] = "./downloads"

@app.post("/download")
async def download_video(request: DownloadRequest):
    ydl_opts = {
        'format': request.format,
        'outtmpl': f"{request.output_path}/%(title)s.%(ext)s",
        'progress_hooks': [lambda d: print(d['status'])],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=True)
            return {"status": "success", "info": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/formats/{video_url:path}")
async def get_available_formats(video_url: str):
    try:
        with yt_dlp.YoutubeDL() as ydl:
            info = ydl.extract_info(video_url, download=False)
            return {"formats": info.get('formats', []), "info": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Frontend Component (React Example)
```tsx
import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';

const VideoDownloader = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('best');
  const [isLoading, setIsLoading] = useState(false);

  const { data: formats } = useQuery(
    ['formats', url],
    async () => {
      const response = await fetch(`/api/formats/${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to load formats');
      const data = await response.json();
      return data.formats;
    },
    { enabled: !!url, refetchOnWindowFocus: false }
  );

  const downloadMutation = useMutation(
    async () => {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format }),
      });
      if (!response.ok) throw new Error('Failed to start download');
      const data = await response.json();
      return data;
    },
    {
      onSuccess: () => {
        alert('Download started!');
      },
      onError: (error) => {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
      },
    }
  );

  return (
    <div>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter video URL"
      />
      
      {formats && (
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          {formats.map((f) => (
            <option key={f.format_id} value={f.format_id}>
              {f.ext} - {f.resolution || f.format_note || f.format_id}
            </option>
          ))}
        </select>
      )}
      
      <button 
        onClick={() => downloadMutation.mutate()} 
        disabled={!url || downloadMutation.isLoading}
      >
        {downloadMutation.isLoading ? 'Downloading...' : 'Download'}
      </button>
    </div>
  );
};

export default VideoDownloader;
```

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock external dependencies
- Test error handling

### Integration Tests
- Test API endpoints
- Test download functionality with mock responses
- Test format conversion

### E2E Tests
- Test complete user flows
- Test with real video URLs
- Cross-browser testing (for web version)

## Deployment

### Web Application
1. **Frontend**:
   ```bash
   npm run build
   # Deploy to Vercel/Netlify
   ```

2. **Backend**:
   ```bash
   # Using Gunicorn with Uvicorn workers
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   # Deploy to Render/Railway/Heroku
   ```

### Desktop Application
1. **Package with PyInstaller**:
   ```bash
   pyinstaller --onefile --windowed --name VideoDownloader main.py
   ```
2. **Create installers**:
   - Windows: NSIS/Inno Setup
   - macOS: create-dmg
   - Linux: AppImage/Flatpak/Snap

## Legal Considerations
- Respect website terms of service
- Implement rate limiting
- Handle copyrighted content appropriately
- Include proper attribution
- Provide clear disclaimers

## Future Enhancements
- Browser extension
- Mobile application
- Batch processing
- Cloud storage integration
- Scheduled downloads
- Playlist support
- Subtitle handling
- Video editing capabilities

## Troubleshooting

### Common Issues
1. **403 Forbidden errors**:
   - Update yt-dlp
   - Configure custom headers
   - Use alternative extractors

2. **Missing formats**:
   - Install FFmpeg
   - Check for format availability
   - Try different user agents

3. **Slow downloads**:
   - Check network connection
   - Try different CDN
   - Adjust concurrency settings

## Support
For support, please open an issue on our [GitHub repository](https://github.com/yourusername/video-downloader).

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# GrooveEstrella (Groove 2.0) 🎵

### **A Premium AI-Powered Music Discovery & Recommendation Platform**

GrooveEstrella is a state-of-the-art music web application designed to deliver highly personalized music recommendations. Rebuilt from the ground up on Next.js, GrooveEstrella connects an open music catalog powered by **MusicBrainz** and **Cover Art Archive** to multiple music platforms—including YouTube, Spotify, Apple Music, Tidal, and SoundCloud—into a unified, modern interface. Leveraging advanced client-side Natural Language Processing (NLP), GrooveEstrella understands your mood, activities, and content preferences to craft the perfect soundtrack for your day—without requiring any proprietary premium subscriptions.

---

## 🌟 **Key Features**

- **🤖 Intelligent Client-Side NLP Chat**: A native Natural Language Processing engine that analyzes your messages to detect emotions (sadness, joy, romance, energy) and activity contexts (coding, studying, working out) to serve context-aware recommendations.
- **🌐 Open Catalog (MusicBrainz & Cover Art Archive)**: Resolves recording metadata, album art, discography, and release groups openly without requiring Spotify Premium or OAuth tokens.
- **🔌 Multi-Platform Integration**: Direct action support across **YouTube**, **Spotify**, **Apple Music**, **Tidal**, and **SoundCloud** on tracks, albums, and artists.
- **📻 Dynamic Music Discovery Dashboard**: Interactive feed containing daily recommendations, category filtering via responsive chips, paginated lists, and live API status checks.
- **🔗 Unified Sharing Suite**: A centralized, custom share modal supporting direct links, QR code preview generation, social share options, and native device sharing (`/s/musicbrainz/...`).
- **🛡️ Smart Content Filter**: Active profanity, drugs, violence, and sexual content detection with customizable severity levels and content warnings.
- **💳 GrooveCard Generator**: Create aesthetic social cards for any track or album with customizable themes, QR codes, and quick audio previews.

---

## 🛠️ **Tech Stack**

- **Frontend Framework**: Next.js 16+ (App Router) & React 19
- **Styling**: Tailwind CSS & Modern Glassmorphic CSS
- **APIs & Data Source**: MusicBrainz WS/2 API & Cover Art Archive
- **NLP Engine**: Custom client-side MusicNLPProcessor
- **Database Layer**: Seamless serverless endpoints and local storage sync

---

## 📊 **How It Works**

```mermaid
graph TD
    A[User Input / Mood Prompt] --> B[Client-Side NLP Processor]
    B -->|Extract Mood & Context| C[Genre & Activity Mapping]
    B -->|Check Explicit Filter| D[Content Warning / Genre Adjustment]
    C & D --> E[MusicBrainz Catalog & CAA Archive]
    E -->|Open Catalog Resolvers| F[Interactive UI Dashboard]
    F -->|Platform Actions| G[YouTube, Spotify, Apple Music, Tidal, SoundCloud]
```

1. **Vibe Input**: Enter how you feel or what you are doing (e.g., "coding in my room" or "feeling pumped at the gym").
2. **Context Parsing**: The NLP engine extracts emotions and matches them against target genres and activity mappings.
3. **Smart Filtering**: Explicit detection layers check the prompt for sensitive terms and apply safe-search boundaries or alert flags.
4. **Music Aggregation**: The dashboard retrieves matching tracks from platform endpoints and serves them with full audio options.

---

## 🚀 **Getting Started & Running Locally**

Follow these instructions to run GrooveEstrella on your local machine:

### 1. Clone the project
```bash
git clone https://github.com/farhanalireza/grooveestrella.git
cd grooveestrella
```

### 2. Configure Environment Variables
Optional: Create a `.env` or `.env.local` file inside the `frontend` folder if you wish to configure custom rate limits or logging. No Spotify credentials or premium accounts are required!

### 3. Install Dependencies
Navigate to the frontend workspace and install the required npm packages:
```bash
cd frontend
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience GrooveEstrella 2.0!

---

## 👥 **Authors**

- [Farhan Ali Reza](https://www.github.com/oopsvincent)
- [Soumodip Mondal](https://www.github.com/soumodip-esc)

---

## 🔗 **Links**
[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://farhanalireza.netlify.app)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/oopsvincent)
[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/oopsvincent)

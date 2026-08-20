# MLBB Hero Insights

An AI-powered chatbot that answers questions about **Mobile Legends: Bang Bang** hero statistics — win rates, ban rates, roles, specialties, and meta insights.

Built as a student project for **BulSU Data Science & Analytics**.

---

## Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Vercel Serverless Functions (`/api/chat.js`)
- **AI Model:** Groq API (`openai/gpt-oss-120b`)
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Groq API key](https://console.groq.com/) (free tier available)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/mlbb-hero-insights.git
cd mlbb-hero-insights

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
# Then open .env.local and paste your real Groq API key
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> ⚠️ **Never commit `.env.local` or any file containing your API key.**
> The `.gitignore` already excludes these files.

### Run Locally

```bash
# Start the Vite dev server (frontend only)
npm run dev
```

The app will be available at **http://localhost:5173**.

> **Note:** To test the AI chatbot backend locally, you'll need the
> Vercel CLI:
>
> ```bash
> npm i -g vercel
> vercel dev
> ```
>
> This runs both the frontend and the `/api/chat` serverless function
> together.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`.

---

## Project Structure

```
├── api/
│   └── chat.js              # Vercel serverless function (Groq API proxy)
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Root component
│   ├── App.css               # Global styles & CSS variables
│   └── components/
│       ├── Chat.jsx           # Main chat interface component
│       └── Chat.css           # Chat-specific styles
├── mlbb_chatbot_context.md   # Hero dataset context (133 heroes)
├── index.html                # Vite HTML entry
├── vite.config.js            # Vite configuration
├── vercel.json               # Vercel routing config
└── package.json
```

## Dataset

Single-day snapshot of **133 heroes** from August 18, 2026, covering:
- Pick rate, ban rate, win rate
- Primary & secondary roles
- Primary & secondary specialties
- Lane assignments

See [`mlbb_chatbot_context.md`](mlbb_chatbot_context.md) for the full
dataset summary used to ground the AI's responses.

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo
3. Add environment variable `GROQ_API_KEY` in Project Settings → Environment Variables
4. Deploy

---

## License

This is a student project for educational purposes.

## Authors

BulSU DSA — Data Engineer Group

# Deploying Punjab Daanish Schools & Center of Excellence Portal to Vercel

This repository is pre-configured with Vercel Serverless Functions (`/api/index.ts`) and Vite static bundle output (`/dist`), making deployment to Vercel straightforward.

---

## Option 1: Deploy via GitHub & Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   - Export or commit your code repository to GitHub.

2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Connect your GitHub account and import your repository.

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**:
   Under **Environment Variables** in the Vercel deployment screen, add the following key-value pairs:

   | Key | Description | Example |
   | --- | --- | --- |
   | `MONGODB_URI` | *(Optional)* Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/daanish_schools_db` |
   | `GEMINI_API_KEY` | *(Optional)* Google Gemini AI API key | `AIzaSy...` |

5. **Deploy**:
   - Click **Deploy**. Vercel will build your frontend assets and deploy the backend Express API as a serverless function.

---

## Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel
   ```

3. **Add Environment Variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add GEMINI_API_KEY
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Features Included in Vercel Configuration (`vercel.json` & `api/index.ts`)
- **Serverless API Routes**: All `/api/*` endpoints are dynamically routed to `api/index.ts` (Express server instance).
- **SPA Fallback**: Single Page Application routes seamlessly load `index.html`.
- **Database Reconnection**: Automatically connects to MongoDB using your `MONGODB_URI` environment variable or the URI saved in portal settings.

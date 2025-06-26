# MiniTranslate API

This is the backend API for the MiniTranslate application, which provides translation services using Google's Gemini AI model.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Translate Text

**Endpoint:** `POST /api/translate`

**Request Body:**
```json
{
  "text": "Text to translate",
  "fromLang": "English",
  "toLang": "Spanish"
}
```

**Response:**
```json
{
  "translatedText": "Texto traducido"
}
```

### Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok"
}
```

## Configuration

The API uses the following configuration:
- Port: 3000 (default)
- Gemini API Key: Configured in the code
- Model: gemini-2.5-flash-lite-preview-06-17

## Mobile App Integration

Update the `API_URL` constant in the mobile app's `translate.tsx` file to point to your API server. 

````markdown
# LLM-Driven Restaurant Finder API

A small Node.js + TypeScript API that uses an LLM (Google Gemini) to turn a free-form text request into a structured JSON command, then calls the Foursquare Places API to find matching restaurants.

This was built for the **Restaurant Finder coding challenge** and is deployed on Vercel.

**Live URL**

```text
https://restaurant-finder-mu-livid.vercel.app
````

---

## ⚙️ What this API does

1. **Client/user sends a GET request** to:

   ```text
   GET /api/execute?message=<your_query>&code=pioneerdevai
   ```

2. The API:

   * Validates the `code` query parameter (simple protection so the endpoint isn’t wide-open).

   * Sends the `message` to **Gemini** with a prompt that forces a **strict JSON response**.

   * Parses that JSON into a `RestaurantCommand` which is like:

     ```json
     {
       "action": "restaurant_search",
       "parameters": {
         "query": "sushi",
         "near": "Manila",
         "max_price": 2,
         "open_now": true,
         "min_rating": 4
       }
     }
     ```

   * Those `parameters` are then used to call the **Foursquare Places API**.

   * Returns a clean JSON response with restaurant details only.

3. **The response shape (simplified):**

   ```json
   {
     "query": "Find me a cheap sushi restaurant in Manila that's open now",
     "command": { "...": "LLM JSON command here" },
     "results": [
       {
         "id": "fsq_place_id",
         "name": "Restaurant Name",
         "address": "123 Sample St",
         "city": "Manila",
         "region": "NCR",
         "country": "PH",
         "categories": ["Sushi", "Japanese"],
         "rating": 4.5,
         "price": 2
       }
     ]
   }
   ```

---

## Tech Stack

* **Language:** Node.js + TypeScript
* **Framework:** Express
* **LLM:** Google Gemini (`@google/generative-ai`)
* **Places data:** Foursquare Places API (new `places-api.foursquare.com` host)
* **Deployment:** Vercel
* **Environment variables:** managed via `.env` locally and Vercel project settings in production

---

## The project Structure

```text
src/
  foursquare/
    client.ts         # Foursquare Places API client
  llm/
    command.ts        # Gemini client + prompt -> JSON command
server.ts           # Express server + /api/execute handler
types.ts            # Shared TypeScript types (RestaurantCommand, parameters, etc.)
 
.env                  # Local environment variables (is not committed)
```

---

## Environment Variables

Create a `.env` file in the project root for local development:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
FSQ_API_KEY=your_foursquare_service_key_here
API_ACCESS_CODE=pioneerdevai        
NODE_ENV=development

```

In production (Vercel), these are set in the **Project → Settings → Environment Variables** UI.

### Why the access code is an env var

The `API_ACCESS_CODE` is read from the environment:

```ts
const ACCESS_CODE = process.env.API_ACCESS_CODE || "pioneerdevai";
```

This allows:

* Using a **different code** in production without changing code.
* Avoiding hard-coding secrets or sharing them accidentally.
* Keeping some protection so random traffic can’t spam the LLM/Foursquare APIs.

---

## When running the project locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

Add the variables shown above (`GEMINI_API_KEY`, `FSQ_API_KEY`, etc.).

### 3. Start in dev mode

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### 4. Test the health route

```text
GET http://localhost:3000/
```

The response shown should be:

```text
Restaurant Finder API is running 
```

### 5. Test the main endpoint

An example request (URL-encoded):

```text
http://localhost:3000/api/execute?message=Find%20me%20a%20cheap%20sushi%20restaurant%20in%20Manila%20that%27s%20open%20now&code=pioneerdevai
```

You should see JSON with:

* the original `query`
* the parsed `command` from Gemini
* `results` array populated from Foursquare

---

## Deployment (Vercel)

The app is deployed as a Node/Express server on Vercel.

Build and run scripts in `package.json`:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "node node_modules/typescript/bin/tsc",
  "start": "node dist/server.js"
}
```


Vercel build:

* **Install Command:** `npm install`
* **Build Command:** `npm run build`
* **Start / Runtime:** Uses `npm start` with the compiled `dist/server.js`

Environment variables to add on Vercel:

* `GEMINI_API_KEY`
* `FSQ_API_KEY`
* `API_ACCESS_CODE`
* `NODE_ENV=production`

---

##  Notes & Tradeoffs
* **The build script on Vercel**
  Uses `node node_modules/typescript/bin/tsc` instead of plain `tsc` to avoid PATH/permission issues in Vercel’s build environment. It just runs the TypeScript compiler via Node.

* **JSON-only LLM output:**
  The Gemini prompt is written so the model must respond with **only valid JSON**. The server parses this JSON and validates the `action` and `parameters` types before calling Foursquare.

* **API protection:**
  The `code` parameter plus `API_ACCESS_CODE` env var is a lightweight guard so the endpoint isn’t completely public if the URL leaks.

* **Extensibility:**
  The `RestaurantCommand` type and `RestaurantSearchParameters` were kept generic so additional parameters (radius, categories, etc.) can be added later by updating the schema and the LLM prompt.

---

## Example Request (Deployed)

```text
https://restaurant-finder-mu-livid.vercel.app/api/execute?message=Find%20me%20a%20cheap%20sushi%20restaurant%20in%20Manila%20that%27s%20open%20now&code=pioneerdevai
```

You can paste this in a browser or use it in Postman to see the live JSON response.

```

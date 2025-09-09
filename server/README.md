Run a tiny OpenAI proxy that forwards chat completion requests to OpenAI without exposing your key in the frontend.

1. Install dependencies (from the `server` folder):

   npm install express node-fetch body-parser

2. Set your API key and start the proxy:

   $env:OPENAI_API_KEY="sk-..."; node openai-proxy.js

3. Client usage:

   POST to `http://localhost:4000/openai` with JSON { "message": "..." }

   The proxy returns { reply: '...', raw: <openai response> }

Wire `MiTiBot` to `${API}/OpenAI` where `API` is your app backend origin. The component will try that endpoint first.

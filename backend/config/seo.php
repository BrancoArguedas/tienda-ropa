<?php

return [
    /** Plantilla compilada del SPA (Vite). En dev cae a frontend/index.html. */
    'index_path' => env('SEO_INDEX_PATH', base_path('../frontend/dist/index.html')),

    /** Bots de IA a los que robots.txt da acceso explícito (visibilidad en ChatGPT, Perplexity, etc.). */
    'ai_bots' => ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
    'allow_ai_bots' => (bool) env('SEO_ALLOW_AI_BOTS', true),
];

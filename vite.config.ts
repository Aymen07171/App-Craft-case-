import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function firebaseAppletFallbackPlugin() {
  return {
    name: 'firebase-applet-fallback',
    resolveId(id: string) {
      if (id.includes('firebase-applet-config.json')) {
        return '\0virtual:firebase-applet-config.json';
      }
      return null;
    },
    load(id: string) {
      if (id === '\0virtual:firebase-applet-config.json') {
        const configPath = path.resolve(import.meta.dirname, 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          try {
            return `export default ${fs.readFileSync(configPath, 'utf-8')};`;
          } catch (_) {}
        }
        return `export default {
          apiKey: process.env.VITE_FIREBASE_API_KEY || "",
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: process.env.VITE_FIREBASE_APP_ID || "",
          oAuthClientId: process.env.VITE_GOOGLE_CLIENT_ID || "458826575164-b6jhkrudbd8ribltergiuiafpb1vhjrr.apps.googleusercontent.com"
        };`;
      }
      return null;
    },
  };
}

function printifyApiPlugin() {
  return {
    name: 'printify-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const reqUrl = req.url || '';
        if (reqUrl === '/api/printify' || reqUrl.startsWith('/api/printify?')) {
          try {
            const { handlePrintifyRequest } = await import('./src/server/printify.ts');
            const url = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
            let body: any = undefined;
            if (req.method !== 'GET') {
              const chunks: any[] = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const raw = Buffer.concat(chunks).toString('utf-8');
              if (raw) {
                try {
                  body = JSON.parse(raw);
                } catch {
                  body = {};
                }
              }
            }
            const headerToken =
              (req.headers['x-printify-token'] as string) ||
              (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
            const token =
              headerToken ||
              body?.token ||
              body?.apiToken ||
              url.searchParams.get('token') ||
              url.searchParams.get('apiToken');
            const result = await handlePrintifyRequest(req.method || 'GET', url, body, token);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.body));
            return;
          } catch (err: any) {
            console.error('Vite Printify middleware error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Printify API handler error' }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), firebaseAppletFallbackPlugin(), printifyApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          launcher: path.resolve(import.meta.dirname, 'index.html'),
          designStudio: path.resolve(import.meta.dirname, 'design-studio/index.html'),
          mockupStudio: path.resolve(import.meta.dirname, 'mockup-studio/index.html'),
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

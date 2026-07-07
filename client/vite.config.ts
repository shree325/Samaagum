import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mpa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlPath = req.url.split('?')[0];
            if (urlPath === '/pages/admin' || urlPath === '/pages/admin/') {
              req.url = '/pages/admin/index.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
            }
          }
          next();
        });
      }
    }
  ],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'pages/Samaagum Auth.html'),
        login: resolve(__dirname, 'pages/Samaagum Login.html'),
        signup: resolve(__dirname, 'pages/Samaagum Signup.html'),
        home: resolve(__dirname, 'pages/Samaagum Home.html'),
        design: resolve(__dirname, 'pages/Samaagum Design System.html'),
        virtual_card: resolve(__dirname, 'pages/VirtualCardPage.html'),
        admin: resolve(__dirname, 'pages/admin/index.html'),
      }
    }
  },
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
});

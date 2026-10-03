// Vite build configuration for the admin dashboard.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const DEV_SERVER_PORT = 5173;

export default defineConfig({
  plugins: [react()],
  server: { port: DEV_SERVER_PORT },
});

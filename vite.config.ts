import path from 'path';
import { defineConfig as viteDefineConfig, loadEnv } from 'vite'; // Alias vite's defineConfig
import { defineConfig as vitestDefineConfig } from 'vitest/config'; // Import vitest's defineConfig
import react from '@vitejs/plugin-react';

export default vitestDefineConfig(({ mode }) => { // Use vitest's defineConfig
    const env = loadEnv(mode, '.', '');
    const viteConfig = viteDefineConfig({ // Use vite's defineConfig for vite-specific config
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Pointing '@' to the project root with an absolute path.
          '@': path.resolve('./src'),
        }
      },
    });
    return {
      ...viteConfig, // Spread the vite config
      test: { // Vitest specific config
        globals: true,
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
      },
    };
});
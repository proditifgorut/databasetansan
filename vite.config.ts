import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration is designed to address persistent module resolution errors
// in a containerized environment by providing explicit paths to the modules.
export default defineConfig({
  plugins: [react()],
  // By removing the 'resolve.alias' section, we allow Vite to use its
  // default, more reliable module resolution to find the packages.
  server: {
    // Loosening file system restrictions can help in environments with
    // emulated file systems like WebContainer.
    fs: {
      strict: false,
    },
  },
});

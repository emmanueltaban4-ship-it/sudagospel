import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.sudagospel',
  appName: 'Sudagospel',
  webDir: 'dist',
  server: {
    url: 'https://667589c6-c293-47e7-a5ed-71db81cdd3f9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;

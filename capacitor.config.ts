import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bioforma.app',
  appName: 'BioForma',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

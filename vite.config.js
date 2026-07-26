import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'import.meta.env.GEARVISION_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''),
      'import.meta.env.GEARVISION_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '',
      ),
      'import.meta.env.GEARVISION_PUBLIC_SITE_URL': JSON.stringify(env.VITE_PUBLIC_SITE_URL || env.VITE_SITE_URL || env.NEXT_PUBLIC_SITE_URL || env.SITE_URL || ''),
    },
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [react()],
  };
});

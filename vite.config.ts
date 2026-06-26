import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 8888,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:21114',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      emptyOutDir: true,
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const segments = id.split('node_modules/')
              const last = segments[segments.length - 1]
              const pkgName = last.startsWith('@')
                ? last.split('/').slice(0, 2).join('/')
                : last.split('/')[0]
              switch (pkgName) {
                case 'vue':
                case 'vue-router':
                case 'pinia':
                case 'vue-i18n':
                  return '_vue'
                case 'naive-ui':
                  return '_naive-ui'
                case 'axios':
                case 'marked':
                case 'nprogress':
                case 'clipboard':
                  return '_vendor'
                default:
                  return '__vendor'
              }
            }
          },
          chunkFileNames: 'static/chunk/[name]-[hash].js',
          entryFileNames: 'static/entry/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    plugins: [
      vue(),
      UnoCSS(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        }],
        dts: 'src/auto-imports.d.ts',
        eslintrc: { enabled: true },
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
  }
})

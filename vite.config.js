import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        host: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: true
    },
    assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg']
}) 
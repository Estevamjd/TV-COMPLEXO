import { defineConfig } from 'vitest/config';
import path from 'path';
import { transformWithOxc } from 'vite';

export default defineConfig({
    plugins: [{
        name: 'jsx-in-js',
        enforce: 'pre',
        transform(code, id) {
            if (/\/(components|app)\/.*\.js$/.test(id)) {
                return transformWithOxc(code, id, { lang: 'jsx', jsx: { runtime: 'automatic' } });
            }
        },
    }],
    test: {
        environment: 'node',
        globals: true,
        include: ['__tests__/**/*.test.{js,ts}'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});

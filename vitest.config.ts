import { defineConfig } from 'vitest/config';
import path from 'node:path';

const nimiRepoRoot = path.resolve(__dirname, '../../nimi');
const nimiSdkSourceRoot = path.resolve(nimiRepoRoot, 'sdks/typescript');
const nimiKitSourceRoot = path.resolve(nimiRepoRoot, 'kit');

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    env: { TZ: 'UTC' },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'scheduler'],
    alias: [
      { find: 'react/jsx-dev-runtime', replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js') },
      { find: 'react/jsx-runtime', replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime.js') },
      { find: 'react-dom/client', replacement: path.resolve(__dirname, 'node_modules/react-dom/client.js') },
      { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules/react-dom/index.js') },
      { find: 'react', replacement: path.resolve(__dirname, 'node_modules/react/index.js') },
      { find: '@renderer', replacement: path.resolve(__dirname, 'src/shell/renderer') },
      { find: '@tauri-apps/api/core', replacement: path.resolve(__dirname, 'node_modules/@tauri-apps/api/core.js') },
      { find: /^@nimiplatform\/sdk$/, replacement: path.resolve(nimiSdkSourceRoot, 'index.ts') },
      { find: /^@nimiplatform\/sdk\/ai$/, replacement: path.resolve(nimiSdkSourceRoot, 'core/ai/index.ts') },
      { find: /^@nimiplatform\/sdk\/app$/, replacement: path.resolve(nimiSdkSourceRoot, 'core/app/index.ts') },
      { find: /^@nimiplatform\/sdk\/contracts$/, replacement: path.resolve(nimiSdkSourceRoot, 'contracts/index.ts') },
      { find: /^@nimiplatform\/sdk\/features\/conversation$/, replacement: path.resolve(nimiSdkSourceRoot, 'features/conversation/index.ts') },
      { find: /^@nimiplatform\/sdk\/features\/generation$/, replacement: path.resolve(nimiSdkSourceRoot, 'features/generation/index.ts') },
      { find: /^@nimiplatform\/sdk\/realm$/, replacement: path.resolve(nimiSdkSourceRoot, 'realm/index.ts') },
      { find: /^@nimiplatform\/sdk\/realm\/generated$/, replacement: path.resolve(nimiSdkSourceRoot, 'realm/generated.ts') },
      { find: /^@nimiplatform\/sdk\/runtime$/, replacement: path.resolve(nimiSdkSourceRoot, 'runtime/index.ts') },
      { find: /^@nimiplatform\/sdk\/runtime\/generated$/, replacement: path.resolve(nimiSdkSourceRoot, 'runtime/generated.ts') },
      { find: /^@nimiplatform\/sdk\/types$/, replacement: path.resolve(nimiSdkSourceRoot, 'types/index.ts') },
      { find: /^@nimiplatform\/kit\/auth$/, replacement: path.resolve(nimiKitSourceRoot, 'auth/src/index.ts') },
      { find: /^@nimiplatform\/kit\/core\/desktop-open$/, replacement: path.resolve(nimiKitSourceRoot, 'core/src/desktop-open.ts') },
      { find: /^@nimiplatform\/kit\/core\/oauth$/, replacement: path.resolve(nimiKitSourceRoot, 'core/src/oauth/index.ts') },
      { find: /^@nimiplatform\/kit\/core\/runtime-capabilities$/, replacement: path.resolve(nimiKitSourceRoot, 'core/src/runtime-capabilities.ts') },
      { find: /^@nimiplatform\/kit\/core\/sdk-contract$/, replacement: path.resolve(nimiKitSourceRoot, 'core/src/sdk-contract.ts') },
      { find: /^@nimiplatform\/kit\/core\/shell-mode$/, replacement: path.resolve(nimiKitSourceRoot, 'core/src/shell-mode.ts') },
      { find: /^@nimiplatform\/kit\/shell\/renderer\/bridge$/, replacement: path.resolve(nimiKitSourceRoot, 'shell/renderer/src/bridge/index.ts') },
      { find: /^@nimiplatform\/kit\/ui$/, replacement: path.resolve(nimiKitSourceRoot, 'ui/src/index.ts') },
    ],
  },
});

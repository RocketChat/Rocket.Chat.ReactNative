import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

import { claudeSubscriptionExecutor } from './e2e/agent/claudeSubscription';

const sharedPermissions = { camera: 'grant', microphone: 'grant', photos: 'grant' } as const;

export default {
	tests: ['e2e/tests/**/*.e2e.ts'],
	targets: [
		{
			name: 'ios',
			engine: mobile({ platform: 'ios', device: process.env.E2E_IOS_DEVICE ?? 'iPhone 17 Pro' }),
			app: { bundleId: 'chat.rocket.ios', appPath: process.env.E2E_IOS_APP_PATH, permissions: sharedPermissions }
		},
		{
			name: 'android',
			engine: mobile({ platform: 'android', device: process.env.E2E_ANDROID_DEVICE ?? 'emulator-5554' }),
			app: {
				bundleId: 'chat.rocket.android',
				appPath: process.env.E2E_ANDROID_APP_PATH,
				permissions: { ...sharedPermissions, notifications: 'grant' }
			}
		}
	],
	timeout: 600_000,
	actionTimeout: 60_000,
	workers: 1,
	agents: { default: { executor: claudeSubscriptionExecutor } }
} satisfies E2EConfig;

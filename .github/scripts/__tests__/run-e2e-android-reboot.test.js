'use strict';

const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'run-e2e.sh');
const REPO_ROOT = path.resolve(__dirname, '../../..');

const adbWithHungBoot = `case "$*" in
  *getprop*) exec sleep 600 ;;
  *"am start"*) exit 1 ;;
  *) exit 0 ;;
esac`;

describe('run-e2e.sh android reboot', () => {
	test('fails fast with an environment error when the emulator never finishes rebooting', () => {
		const startedAt = Date.now();

		const result = runScript(SCRIPT, {
			args: ['android', '1'],
			cwd: REPO_ROOT,
			stubs: { adb: adbWithHungBoot, curl: 'printf 200' },
			env: { ANDROID_ADB_TIMEOUT: '1', ANDROID_REBOOT_TIMEOUT: '3' }
		});

		expect(result.status).toBe(3);
		expect(result.stdout).toContain('::error title=Emulator reboot hung::');
		expect(Date.now() - startedAt).toBeLessThan(20000);
	}, 30000);
});

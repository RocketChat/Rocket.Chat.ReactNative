'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');

const WATCHDOG = path.join(__dirname, '..', 'android-boot-watchdog.sh');

function startStuckAction() {
	return spawn('sleep', ['600'], { stdio: 'ignore' });
}

function isAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function runWatchdog(actionPid, env = {}) {
	const startedAt = Date.now();
	const result = spawnSync('bash', [WATCHDOG, String(actionPid)], {
		encoding: 'utf8',
		timeout: 30000,
		env: { ...process.env, BOOT_DEADLINE_SECONDS: '2', POLL_SECONDS: '1', ...env }
	});
	return { ...result, elapsedMs: Date.now() - startedAt };
}

function waitForExit(child) {
	return new Promise(resolve => (child.exitCode !== null || child.signalCode ? resolve() : child.once('exit', resolve)));
}

describe('android-boot-watchdog.sh', () => {
	test('stops the action with an error when the e2e script never starts', async () => {
		const action = startStuckAction();

		const result = runWatchdog(action.pid, { E2E_SCRIPT_PATTERN: 'no-such-e2e-script-running' });
		await waitForExit(action);

		expect(result.status).toBe(1);
		expect(result.stdout).toContain('::error title=Emulator boot hung::');
		expect(action.signalCode).toBe('SIGTERM');
		expect(result.elapsedMs).toBeLessThan(10000);
	});

	test('leaves the action running once the e2e script has started', () => {
		const action = startStuckAction();
		const e2eScript = spawn('bash', ['-c', 'sleep 600; true', 'fake-run-e2e-for-watchdog-test'], { stdio: 'ignore', detached: true });

		try {
			const result = runWatchdog(action.pid, { E2E_SCRIPT_PATTERN: 'fake-run-e2e-for-watchdog-test' });

			expect(result.status).toBe(0);
			expect(result.stdout).toBe('');
			expect(isAlive(action.pid)).toBe(true);
		} finally {
			action.kill();
			process.kill(-e2eScript.pid);
		}
	});

	test('exits quietly when the action finishes before the deadline', async () => {
		const action = startStuckAction();
		action.kill();
		await waitForExit(action);

		const result = runWatchdog(action.pid, { E2E_SCRIPT_PATTERN: 'no-such-e2e-script-running', BOOT_DEADLINE_SECONDS: '600' });

		expect(result.status).toBe(0);
		expect(result.stdout).toBe('');
	});
});

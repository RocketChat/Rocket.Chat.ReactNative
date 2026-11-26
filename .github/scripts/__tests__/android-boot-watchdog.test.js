'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { runScript } = require('../testlib/runScript');

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

function runWatchdog(actionPid, deadlineSeconds) {
	return runScript(WATCHDOG, { args: [String(actionPid)], env: { BOOT_DEADLINE_SECONDS: String(deadlineSeconds) } });
}

function waitForExit(child) {
	return new Promise(resolve => (child.exitCode !== null || child.signalCode ? resolve() : child.once('exit', resolve)));
}

describe('android-boot-watchdog.sh', () => {
	test('stops the action with an error once the deadline passes without the e2e script', async () => {
		const action = startStuckAction();

		const result = runWatchdog(action.pid, 0);
		await waitForExit(action);

		expect(result.status).toBe(1);
		expect(result.stdout).toContain('::error title=Emulator boot hung::');
		expect(action.signalCode).toBe('SIGTERM');
	});

	test('leaves the action running once the e2e script has started', () => {
		const action = startStuckAction();
		const e2eScript = spawn('bash', ['-c', 'sleep 600; true', 'run-e2e.sh android'], { stdio: 'ignore', detached: true });

		try {
			const result = runWatchdog(action.pid, 0);

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

		const result = runWatchdog(action.pid, 600);

		expect(result.status).toBe(0);
		expect(result.stdout).toBe('');
	});
});

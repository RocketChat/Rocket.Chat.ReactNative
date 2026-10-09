'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'collect-e2e-replays.sh');

const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });

function makeRepoWithCommittedReplays(files) {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'collect-e2e-replays-'));
	git(repo, 'init', '-q');
	fs.mkdirSync(path.join(repo, '.e2e/cache'), { recursive: true });
	for (const [name, content] of Object.entries(files)) {
		fs.writeFileSync(path.join(repo, '.e2e/cache', name), content);
	}
	git(repo, 'add', '.');
	git(repo, '-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-q', '--allow-empty', '-m', 'replays');
	return repo;
}

const writeReplay = (repo, name, content) => fs.writeFileSync(path.join(repo, '.e2e/cache', name), content);

describe('collect-e2e-replays.sh', () => {
	it('copies recorded and re-recorded replays, skipping unchanged and evicted ones', () => {
		const repo = makeRepoWithCommittedReplays({ 'unchanged.json': 'a', 'rerecorded.json': 'b', 'evicted.json': 'c' });
		writeReplay(repo, 'rerecorded.json', 'b2');
		writeReplay(repo, 'recorded.json', 'd');
		fs.rmSync(path.join(repo, '.e2e/cache/evicted.json'));

		const { status, output } = runScript(SCRIPT, { args: ['replays'], cwd: repo });

		expect(status).toBe(0);
		expect(output).toBe('count=2\n');
		expect(fs.readdirSync(path.join(repo, 'replays')).sort()).toEqual(['recorded.json', 'rerecorded.json']);
		expect(fs.readFileSync(path.join(repo, 'replays/rerecorded.json'), 'utf8')).toBe('b2');
	});

	it('redacts credentials from the collected replays', () => {
		const repo = makeRepoWithCommittedReplays({});
		writeReplay(repo, 'recorded.json', '{"summary":"signed in as admin.user"}');

		runScript(SCRIPT, { args: ['replays'], cwd: repo, env: { E2E_ADMIN_USER: 'admin.user' } });

		expect(fs.readFileSync(path.join(repo, 'replays/recorded.json'), 'utf8')).toBe('{"summary":"signed in as ***REDACTED***"}');
	});

	it('reports zero when the run recorded nothing', () => {
		const repo = makeRepoWithCommittedReplays({ 'unchanged.json': 'a' });

		const { status, output } = runScript(SCRIPT, { args: ['replays'], cwd: repo });

		expect(status).toBe(0);
		expect(output).toBe('count=0\n');
	});
});

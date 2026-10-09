'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'comment-e2e-replays.sh');

const env = { PR_NUMBER: '42', RUN_ID: '1001', GITHUB_REPOSITORY: 'owner/repo' };

const replay = (testId, targetId) => JSON.stringify({ payload: { recordedFor: { testId, targetId } } });

function makeReplaysDir(files) {
	const replaysDir = fs.mkdtempSync(path.join(os.tmpdir(), 'comment-e2e-replays-'));
	for (const [relativePath, content] of Object.entries(files)) {
		const filePath = path.join(replaysDir, relativePath);
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, content);
	}
	return replaysDir;
}

function ghStub(existingComments) {
	const callsFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gh-calls-')), 'calls');
	const comments = JSON.stringify(existingComments);
	const stub = `
if [ "$1" = "api" ] && [ "$2" = "--paginate" ]; then
  echo '${comments}' | jq -r "$5"
  exit 0
fi
printf '%s\\n' "$*" >> "${callsFile}"
`;
	return { stubs: { gh: stub }, readCalls: () => (fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf8') : '') };
}

describe('comment-e2e-replays.sh', () => {
	it('posts one line per test with its platforms and the download command', () => {
		const replaysDir = makeReplaysDir({
			'e2e-replays-android-1/a.json': replay('e2e/tests/onboarding/legal.e2e.ts::opens%20legal', 'android'),
			'e2e-replays-ios-1/b.json': replay('e2e/tests/onboarding/legal.e2e.ts::opens%20legal', 'ios'),
			'e2e-replays-ios-1/c.json': replay('e2e/tests/assorted/change-avatar.e2e.ts::changes%20the%20avatar', 'ios')
		});
		const gh = ghStub([]);

		const { status } = runScript(SCRIPT, { args: [replaysDir], env, stubs: gh.stubs });

		expect(status).toBe(0);
		const calls = gh.readCalls();
		expect(calls).toContain('api repos/owner/repo/issues/42/comments -f body=<!-- e2e-replays -->');
		expect(calls).toContain('- `e2e/tests/assorted/change-avatar.e2e.ts` (ios)');
		expect(calls).toContain('- `e2e/tests/onboarding/legal.e2e.ts` (android, ios)');
		expect(calls).toContain("gh run download 1001 -R owner/repo -p 'e2e-replays-*'");
	});

	it('updates the existing comment instead of posting another', () => {
		const replaysDir = makeReplaysDir({ 'e2e-replays-ios-1/a.json': replay('e2e/tests/a.e2e.ts::a', 'ios') });
		const gh = ghStub([
			{ id: 7, body: 'unrelated' },
			{ id: 9, body: '<!-- e2e-replays -->\nold' }
		]);

		runScript(SCRIPT, { args: [replaysDir], env, stubs: gh.stubs });

		expect(gh.readCalls()).toMatch(/^api -X PATCH repos\/owner\/repo\/issues\/comments\/9 -f body=<!-- e2e-replays -->/);
	});

	it('marks an existing comment as in sync when the run recorded nothing', () => {
		const gh = ghStub([{ id: 9, body: '<!-- e2e-replays -->\nold' }]);

		runScript(SCRIPT, { args: [path.join(os.tmpdir(), 'comment-e2e-replays-missing', String(process.pid))], env, stubs: gh.stubs });

		const calls = gh.readCalls();
		expect(calls).toContain('issues/comments/9');
		expect(calls).toContain('replays in sync');
	});

	it('stays silent when the run recorded nothing and no comment exists', () => {
		const gh = ghStub([]);

		const { status } = runScript(SCRIPT, { args: [makeReplaysDir({})], env, stubs: gh.stubs });

		expect(status).toBe(0);
		expect(gh.readCalls()).toBe('');
	});
});

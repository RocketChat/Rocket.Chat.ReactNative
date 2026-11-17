'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { runScript } = require('../testlib/runScript');

const SCRIPT = path.join(__dirname, '..', 'redact-e2e-output.sh');

const credentials = {
	E2E_ADMIN_USER: 'admin.user',
	E2E_ADMIN_PASSWORD: 'p@ss$word.1',
	E2E_SAML_USERNAME: '',
	E2E_SAML_PASSWORD: '',
	E2E_CAS_USERNAME: '',
	E2E_CAS_PASSWORD: '',
	CLAUDE_CODE_OAUTH_TOKEN: 'oauth-token.value'
};

function makeOutputDir(files) {
	const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'redact-e2e-'));
	for (const [relativePath, content] of Object.entries(files)) {
		const filePath = path.join(outputDir, relativePath);
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, content);
	}
	return outputDir;
}

const read = (outputDir, relativePath) => fs.readFileSync(path.join(outputDir, relativePath), 'utf8');

describe('redact-e2e-output.sh', () => {
	it('replaces every credential value in report files, including nested artifacts', () => {
		const outputDir = makeOutputDir({
			'report.json': '{"user":"admin.user","password":"p@ss$word.1"}',
			'artifacts/shard/log.txt': 'login admin.user / p@ss$word.1 then admin.user again',
			'artifacts/shard/agent.log': 'Authorization: Bearer oauth-token.value'
		});

		const { status } = runScript(SCRIPT, { args: [outputDir], env: credentials });

		expect(status).toBe(0);
		expect(read(outputDir, 'report.json')).toBe('{"user":"***REDACTED***","password":"***REDACTED***"}');
		expect(read(outputDir, 'artifacts/shard/log.txt')).toBe('login ***REDACTED*** / ***REDACTED*** then ***REDACTED*** again');
		expect(read(outputDir, 'artifacts/shard/agent.log')).toBe('Authorization: Bearer ***REDACTED***');
	});

	it('replaces the token query parameter of auth deep links', () => {
		const outputDir = makeOutputDir({
			'report.json': '{"url":"rocketchat://auth?host=open.rocket.chat&userId=abc&token=Xy_9-Zq.w"}',
			'log.txt': 'open rocketchat://auth?token=Xy_9-Zq.w&userId=abc'
		});

		runScript(SCRIPT, { args: [outputDir], env: credentials });

		expect(read(outputDir, 'report.json')).toBe(
			'{"url":"rocketchat://auth?host=open.rocket.chat&userId=abc&token=***REDACTED***"}'
		);
		expect(read(outputDir, 'log.txt')).toBe('open rocketchat://auth?token=***REDACTED***&userId=abc');
	});

	it('redacts decoded JSON strings and keys, including escaped credentials', () => {
		const password = 'quote"slash\\secret\nnext';
		const outputDir = makeOutputDir({
			'report.json': JSON.stringify({ nested: [{ password, message: `login ${password}` }], [password]: 'key' }),
			'events.jsonl': `${JSON.stringify({ password })}\n${JSON.stringify({ password })}\n`
		});
		const { status } = runScript(SCRIPT, { args: [outputDir], env: { ...credentials, E2E_ADMIN_PASSWORD: password } });

		expect(status).toBe(0);
		expect(JSON.parse(read(outputDir, 'report.json'))).toEqual({
			nested: [{ password: '***REDACTED***', message: 'login ***REDACTED***' }],
			'***REDACTED***': 'key'
		});
		expect(read(outputDir, 'events.jsonl').trim().split('\n').map(JSON.parse)).toEqual([
			{ password: '***REDACTED***' },
			{ password: '***REDACTED***' }
		]);
	});

	it('redacts XML-escaped credentials without altering binary evidence', () => {
		const binary = Buffer.from([0, 255, 137, 80, 78, 71]);
		const outputDir = makeOutputDir({
			'junit.xml': '<failure message="quote&quot;&amp;&lt;secret"/>',
			'artifacts/screen.png': binary,
			'artifacts/video.mp4': binary
		});
		const { status } = runScript(SCRIPT, { args: [outputDir], env: { ...credentials, E2E_ADMIN_PASSWORD: 'quote"&<secret' } });

		expect(status).toBe(0);
		expect(read(outputDir, 'junit.xml')).toBe('<failure message="***REDACTED***"/>');
		expect(fs.readFileSync(path.join(outputDir, 'artifacts/screen.png'))).toEqual(binary);
		expect(fs.readFileSync(path.join(outputDir, 'artifacts/video.mp4'))).toEqual(binary);
	});

	it('fails before modifying output when a JSON report cannot be parsed', () => {
		const outputDir = makeOutputDir({ 'a.log': 'admin.user', 'report.json': '{broken' });
		const { status } = runScript(SCRIPT, { args: [outputDir], env: credentials });

		expect(status).not.toBe(0);
		expect(read(outputDir, 'a.log')).toBe('admin.user');
	});

	it('fails without touching any file when compressed output is present', () => {
		const outputDir = makeOutputDir({
			'report.json': '{"user":"admin.user"}',
			'artifacts/device/logcat.txt.gz': 'admin.user'
		});

		const { status } = runScript(SCRIPT, { args: [outputDir], env: credentials });

		expect(status).not.toBe(0);
		expect(read(outputDir, 'report.json')).toBe('{"user":"admin.user"}');
	});

	it('ignores compressed files in the cache folder', () => {
		const outputDir = makeOutputDir({ 'cache/replay.gz': 'cached', 'junit.xml': 'admin.user' });

		const { status } = runScript(SCRIPT, { args: [outputDir], env: credentials });

		expect(status).toBe(0);
		expect(read(outputDir, 'junit.xml')).toBe('***REDACTED***');
	});

	it('leaves the cache folder untouched', () => {
		const outputDir = makeOutputDir({ 'cache/state.json': 'admin.user' });

		runScript(SCRIPT, { args: [outputDir], env: credentials });

		expect(read(outputDir, 'cache/state.json')).toBe('admin.user');
	});

	it('does not blank file contents when no credential is set', () => {
		const outputDir = makeOutputDir({ 'junit.xml': '<testsuite name="login"/>' });

		const { status } = runScript(SCRIPT, {
			args: [outputDir],
			env: Object.fromEntries(Object.keys(credentials).map(name => [name, '']))
		});

		expect(status).toBe(0);
		expect(read(outputDir, 'junit.xml')).toBe('<testsuite name="login"/>');
	});

	it('succeeds when the output folder does not exist', () => {
		const { status } = runScript(SCRIPT, { args: [path.join(os.tmpdir(), 'redact-e2e-missing', String(process.pid))] });

		expect(status).toBe(0);
	});
});

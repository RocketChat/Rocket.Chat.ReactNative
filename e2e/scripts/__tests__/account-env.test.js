'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'account-env.mjs');
const nastyPassword = `it's $HOME "quoted" \`whoami\` $(id) back\\slash ; spaced`;

function writeAccountEnv(accountSource) {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'account-env-'));
	const accountFile = path.join(directory, 'e2e_account.js');
	const envFile = path.join(directory, '.env.e2e');
	fs.writeFileSync(accountFile, accountSource);
	fs.writeFileSync(envFile, execFileSync(process.execPath, [SCRIPT, accountFile]));
	return envFile;
}

const sourceAndPrint = (envFile, name) =>
	execFileSync('sh', ['-c', `set -a; . "$1"; set +a; printf %s "$${name}"`, 'sh', envFile], { encoding: 'utf8' });

describe('account-env', () => {
	it('round-trips shell metacharacters through sourcing', () => {
		const envFile = writeAccountEnv(
			`const account = ${JSON.stringify({ adminUser: 'fake.admin', adminPassword: nastyPassword })};`
		);

		expect(sourceAndPrint(envFile, 'E2E_ADMIN_USER')).toBe('fake.admin');
		expect(sourceAndPrint(envFile, 'E2E_ADMIN_PASSWORD')).toBe(nastyPassword);
	});

	it.each(['module.exports = { account };', 'export default account;'])('ignores the module line %s', exportLine => {
		const envFile = writeAccountEnv(`const account = { adminUser: 'fake.admin' };\n${exportLine}\n`);

		expect(sourceAndPrint(envFile, 'E2E_ADMIN_USER')).toBe('fake.admin');
	});
});

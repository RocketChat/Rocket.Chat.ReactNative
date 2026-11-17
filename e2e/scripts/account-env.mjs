import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const moduleSyntax = /^\s*(output\.account|module\.exports|export\s+default)[\s=]/;
const source = readFileSync(process.argv[2] ?? 0, 'utf8')
	.split('\n')
	.filter(line => !moduleSyntax.test(line))
	.join('\n');
const sandbox = { output: {} };
vm.runInNewContext(`${source}\noutput.account = account;`, sandbox);
const { account } = sandbox.output;

const variables = {
	E2E_ADMIN_USER: account.adminUser,
	E2E_ADMIN_PASSWORD: account.adminPassword,
	E2E_SAML_USERNAME: account.saml?.username,
	E2E_SAML_PASSWORD: account.saml?.password,
	E2E_CAS_USERNAME: account.cas?.username,
	E2E_CAS_PASSWORD: account.cas?.password
};

const shellQuote = value => `'${String(value).replaceAll("'", "'\\''")}'`;

for (const [name, value] of Object.entries(variables)) {
	if (value) {
		process.stdout.write(`${name}=${shellQuote(value)}\n`);
	}
}

// Shared harness for the selection-logic tests: run a shell script under test
// with stubbed executables on $PATH and a scratch $GITHUB_OUTPUT, then read back
// the emitted key=value pairs. Real jq/grep/sort/paste are used (they are correct
// tools, not the unit under test); only external deps like sniffler/git/maestro
// are stubbed via the `stubs` map.
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// stubs: { binName: 'bash body' | '#!/usr/bin/env bash\n…' }
// env:   extra environment variables for the script
// args:  argv passed to the script
function runScript(scriptPath, { stubs = {}, env = {}, args = [] } = {}) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'selshard-'));
	const binDir = path.join(tmp, 'bin');
	fs.mkdirSync(binDir);

	for (const [name, body] of Object.entries(stubs)) {
		const file = path.join(binDir, name);
		fs.writeFileSync(file, body.startsWith('#!') ? body : `#!/usr/bin/env bash\n${body}`);
		fs.chmodSync(file, 0o755);
	}

	const outFile = path.join(tmp, 'github_output');
	fs.writeFileSync(outFile, '');

	let status = 0;
	let stdout = '';
	let stderr = '';
	try {
		stdout = execFileSync('bash', [scriptPath, ...args], {
			encoding: 'utf8',
			env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, GITHUB_OUTPUT: outFile, ...env }
		});
	} catch (e) {
		status = e.status ?? 1;
		stdout = e.stdout || '';
		stderr = e.stderr || '';
	}

	const output = fs.readFileSync(outFile, 'utf8');
	const get = key => {
		const m = output.match(new RegExp(`^${key}=(.*)$`, 'm'));
		return m ? m[1] : undefined;
	};

	fs.rmSync(tmp, { recursive: true, force: true });
	return { status, stdout, stderr, output, shards: get('shards'), should_run: get('should_run') };
}

module.exports = { runScript };

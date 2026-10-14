const fs = require('fs');
const os = require('os');
const path = require('path');
const YAML = require(path.join(path.dirname(require.resolve('yaml/package.json')), 'dist/index.js'));

const { runScript } = require('../testlib/runScript');

const workflow = YAML.parse(fs.readFileSync(path.join(__dirname, '../../workflows/e2e-build-android.yml'), 'utf8'));
const action = YAML.parse(fs.readFileSync(path.join(__dirname, '../../actions/native-fingerprint/action.yml'), 'utf8'));
const steps = workflow.jobs['android-build'].steps;

describe('Android native cache identity', () => {
	let directory;
	beforeEach(() => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'native-cache-'));
	});
	afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

	const keyFor = () => {
		const resourceDir = path.join(directory, 'res');
		const resourceHash = runScript(path.join(__dirname, '../hash-dir.sh'), { args: [resourceDir] }).stdout.trim();
		const prefix = steps.find(step => step.id === 'fingerprint').with['cache-key-prefix']
			.replace(/\$\{\{ hashFiles\(.*?\) \}\}/, 'workflow')
			.replace('${{ steps.resources.outputs.hash }}', resourceHash);
		const script = path.join(directory, 'fingerprint.sh');
		fs.writeFileSync(script, action.runs.steps.find(step => step.id === 'key').run);
		const result = runScript(script, {
			stubs: { pnpm: 'echo \'{"hash":"same-native-inputs"}\'' },
			env: { CACHE_KEY_PREFIX: prefix, PLATFORM: 'android', GITHUB_STEP_SUMMARY: path.join(directory, 'summary') }
		});
		expect(result.status).toBe(0);
		return result.output.match(/^cache-key=(.*)$/m)[1];
	};

	it('invalidates a cached APK when an image changes or an existing image starts being bundled', () => {
		const resourceDir = path.join(directory, 'res');
		fs.mkdirSync(resourceDir);
		fs.writeFileSync(path.join(resourceDir, 'logo.png'), 'old image');
		const original = keyFor();
		fs.writeFileSync(path.join(resourceDir, 'logo.png'), 'new image');
		const changedImage = keyFor();
		fs.writeFileSync(path.join(resourceDir, 'already-existing-image.png'), 'newly imported image');
		const changedImports = keyFor();

		expect(changedImage).not.toBe(original);
		expect(changedImports).not.toBe(changedImage);
		expect(keyFor()).toBe(changedImports);
	});

	it('computes resources before lookup even for a seed run', () => {
		expect(workflow.jobs['android-build'].if).toBeUndefined();
		expect(steps.findIndex(step => step.id === 'resources')).toBeLessThan(steps.findIndex(step => step.id === 'fingerprint'));
	});
});

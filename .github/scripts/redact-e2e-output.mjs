import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outputDir = process.argv[2] ?? '.e2e';
const marker = '***REDACTED***';
const credentials = [
	'E2E_ADMIN_USER',
	'E2E_ADMIN_PASSWORD',
	'E2E_SAML_USERNAME',
	'E2E_SAML_PASSWORD',
	'E2E_CAS_USERNAME',
	'E2E_CAS_PASSWORD',
	'CLAUDE_CODE_OAUTH_TOKEN'
]
	.map(name => process.env[name])
	.filter(Boolean)
	.sort((left, right) => right.length - left.length);

const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.mov', '.pdf']);
const compressedExtensions = new Set(['.gz', '.zip', '.tgz', '.bz2', '.xz']);
const textSecrets = [...new Set(credentials.flatMap(secret => [secret, JSON.stringify(secret).slice(1, -1)]))].sort(
	(left, right) => right.length - left.length
);
const xmlEscape = value =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const redactText = (value, secrets = credentials) => {
	for (const secret of secrets) {
		value = value.replaceAll(secret, marker);
	}
	return value.replace(/([?&]token=)[^&\s"<>\\]+/g, `$1${marker}`);
};

const redactValue = value => {
	if (typeof value === 'string') return redactText(value);
	if (Array.isArray(value)) return value.map(redactValue);
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, entry]) => [redactText(key), redactValue(entry)]));
	}
	return value;
};

const filesUnder = directory =>
	readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const file = path.join(directory, entry.name);
		if (file === path.join(outputDir, 'cache') && entry.isDirectory()) return [];
		if (entry.isDirectory()) return filesUnder(file);
		if (!entry.isFile()) throw new Error(`Unsupported output entry: ${file}`);
		return [file];
	});

const redactedFile = file => {
	const extension = path.extname(file).toLowerCase();
	if (binaryExtensions.has(extension)) return undefined;
	const source = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file));
	if (extension === '.json') return JSON.stringify(redactValue(JSON.parse(source)));
	if (extension === '.jsonl') {
		return source
			.split('\n')
			.map(line => (line.trim() ? JSON.stringify(redactValue(JSON.parse(line))) : line))
			.join('\n');
	}
	if (extension === '.xml' || extension === '.html') {
		return redactText(source, [...textSecrets, ...textSecrets.map(xmlEscape)].sort((left, right) => right.length - left.length));
	}
	return redactText(source, textSecrets);
};

try {
	if (!existsSync(outputDir)) process.exit(0);
	const files = filesUnder(outputDir);
	const compressed = files.filter(file => compressedExtensions.has(path.extname(file).toLowerCase()));
	if (compressed.length) throw new Error(`Compressed files cannot be redacted, so nothing is uploaded: ${compressed.join(', ')}`);
	const updates = files.map(file => [file, redactedFile(file)]);
	for (const [file, content] of updates) {
		if (content !== undefined) writeFileSync(file, content);
	}
} catch {
	console.error('::error title=Unredactable E2E output::Could not redact E2E output; nothing is uploaded.');
	process.exitCode = 1;
}

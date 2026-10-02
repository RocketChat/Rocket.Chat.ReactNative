const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REMOTE = [
	['XJR2sjYfSAMz5eyT2/test.pdf', 'test.pdf'],
	['8hbJ3HH6tBGxQk6QY/test.docx', 'test.docx'],
	['juC7BJroRjHHostn5/test.html', 'test.html'],
	['Q8HDSij22PBJtZDgc/test.txt', 'test.txt'],
	['H44YcW5DTDj6fASnN/test.zip', 'test.zip'],
	['EgmkWnFjnGoktb7f4/test.wav', 'test.wav'],
	['ccoC8yQxmqT9fdAMs/test.ogg', 'test.ogg'],
	['MPp42KbYLaAZzNqis/test.mp3', 'test.mp3'],
	['ZumNhPm24WBvWzEJu/test.mp4', 'test.mp4'],
	['MXMdYzmz9fSxeoF7H/image.png', 'image.png'],
	['CrmXg9mNbomgzC7iw/test.heic', 'test.heic'],
	['dKdmmLYEqbujkkJzn/test.mov', 'test.mov'],
	['jJNm36QhGhh4eJ9QS/test.m4a', 'test.m4a']
];

function readMaestroConfig() {
	const dir = path.join(__dirname, '..', '.maestro', 'scripts');
	const server = fs
		.readFileSync(path.join(dir, 'data.js'), 'utf8')
		.match(/^[ \t]*server:\s*['"]([^'"]+)['"]/m)?.[1];
	const accountSrc = fs.readFileSync(path.join(dir, 'e2e_account.js'), 'utf8');
	const adminUser = accountSrc.match(/adminUser:\s*['"]([^'"]+)['"]/)?.[1];
	const adminPass = accountSrc.match(/adminPassword:\s*['"]([^'"]+)['"]/)?.[1];
	if (!server || !adminUser || !adminPass) throw new Error('could not parse server/admin from data.js/e2e_account.js');
	return { server, adminUser, adminPass };
}

function randomText(length) {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let text = '';
	for (let i = 0; i < length; i += 1) text += chars[Math.floor(Math.random() * chars.length)];
	return text;
}

function newTestUser() {
	const rand = randomText(10);
	return {
		username: `user${rand}`,
		name: `user${rand}`,
		password: `Aa1${randomText(7)}`,
		email: `mobile+${rand}@rocket.chat`
	};
}

async function api(server, method, endpoint, { headers, body } = {}) {
	const response = await fetch(`${server}/api/v1/${endpoint}`, {
		method,
		headers: { 'Content-Type': 'application/json', ...headers },
		...(body ? { body: JSON.stringify(body) } : {})
	});
	const data = await response.json().catch(() => null);
	if (!response.ok) throw new Error(`${endpoint}: ${data?.error || data?.message || `HTTP ${response.status}`}`);
	return data;
}

async function login(server, username, password) {
	const { userId, authToken } = (await api(server, 'POST', 'login', { body: { user: username, password } })).data;
	return { userId, authToken, headers: { 'X-User-Id': userId, 'X-Auth-Token': authToken } };
}

async function logout(server, auth) {
	try {
		await api(server, 'POST', 'logout', { headers: auth.headers });
	} catch {}
}

async function createTestUser(server, admin, testUser) {
	await api(server, 'POST', 'users.create', {
		headers: admin.headers,
		body: {
			username: testUser.username,
			name: testUser.name,
			password: testUser.password,
			email: testUser.email
		}
	});
}

async function deleteTestUser(server, admin, userId) {
	await api(server, 'POST', 'users.delete', { headers: admin.headers, body: { userId, confirmRelinquish: true } });
}

async function downloadFixtures(server, test) {
	const fixtures = new Map();
	for (const [remote, name] of REMOTE) {
			const r = await fetch(`${server}/file-upload/${remote}?download=1`, { headers: test.headers });
		if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
		const buf = Buffer.from(await r.arrayBuffer());
		if (!buf.length) throw new Error(`${name}: empty body`);
		fixtures.set(name, buf);
	}
	return fixtures;
}

async function fetchRealFixtures() {
	const { server, adminUser, adminPass } = readMaestroConfig();
	const admin = await login(server, adminUser, adminPass);
	const testUser = newTestUser();
	let test = null;
	let created = false;
	try {
		await createTestUser(server, admin, testUser);
		created = true;
		test = await login(server, testUser.username, testUser.password);
		return await downloadFixtures(server, test);
	} finally {
		if (test) await logout(server, test);
		if (created) {
			let userId = test?.userId;
			if (!userId) {
				try {
					userId = (await api(server, 'GET', `users.info?username=${testUser.username}`, { headers: admin.headers })).user._id;
				} catch {}
			}
			if (userId) {
				try {
					await deleteTestUser(server, admin, userId);
				} catch (e) {
					console.warn(`warn: delete test user failed (${e.message})`);
				}
			}
		}
		await logout(server, admin);
	}
}

function androidSerial() {
	const out = execFileSync('adb', ['devices'], { encoding: 'utf8' });
	const serials = out
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.endsWith('\tdevice'))
		.map(l => l.split('\t')[0]);
	if (serials.length === 0) throw new Error('no Android device found; start an emulator before running this script');
	if (serials.length > 1) throw new Error(`multiple Android devices found: ${serials.join(', ')}`);
	return serials[0];
}

function adb(serial, ...args) {
	return execFileSync('adb', ['-s', serial, ...args], { stdio: 'ignore' });
}

function pushAndroid(fixtures) {
	const serial = androidSerial();
	console.log(`Downloads: adb://${serial}/sdcard/Download/`);
	const results = [];
	for (const [name, content] of fixtures) {
		let exists = false;
		try {
			adb(serial, 'shell', 'test', '-s', `/sdcard/Download/${name}`);
			exists = true;
		} catch {}
		if (exists) {
			results.push(`keep ${name}`);
			continue;
		}
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'push-dl-'));
		try {
			const tmp = path.join(dir, name);
			fs.writeFileSync(tmp, content);
			adb(serial, 'push', tmp, `/sdcard/Download/${name}`);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
		results.push(`made ${name}`);
	}
	console.log(results.join('\n'));
	console.log('---');
	console.log(execFileSync('adb', ['-s', serial, 'shell', 'ls', '/sdcard/Download/'], { encoding: 'utf8' }));
}

async function main() {
	const fixtures = await fetchRealFixtures();
	pushAndroid(fixtures);
}

main().catch(e => {
	console.error(e.message);
	process.exit(1);
});

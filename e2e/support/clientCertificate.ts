import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { request as httpsRequest, createServer, type Server } from 'node:https';
import type { AddressInfo, Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { expect } from 'e2e';

import { data } from './data';
import { type Fixtures, LONG_TIMEOUT, fillWhenUncovered, succeeds, tapWhenUncovered } from './flows';

const runCommand = promisify(execFile);

const PROXY_HOST = '127.0.0.1';
const ANDROID_EMULATOR_HOST_LOOPBACK = '10.0.2.2';
const VALIDITY_DAYS = '2';

export interface ClientCertificate {
	directory: string;
	alias: string;
	password: string;
	certificateAuthorityPath: string;
	p12Path: string;
	fileName: string;
}

const openssl = (...args: string[]) => runCommand('openssl', args);

const signCertificate = async (directory: string, name: string, subject: string, extensions: string) => {
	const key = join(directory, `${name}.key`);
	const request = join(directory, `${name}.csr`);
	const extensionsFile = join(directory, `${name}.ext`);
	await writeFile(extensionsFile, extensions);
	await openssl('req', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', request, '-subj', subject);
	await openssl(
		'x509',
		'-req',
		'-in',
		request,
		'-CA',
		join(directory, 'ca.pem'),
		'-CAkey',
		join(directory, 'ca.key'),
		'-CAcreateserial',
		'-days',
		VALIDITY_DAYS,
		'-extfile',
		extensionsFile,
		'-out',
		join(directory, `${name}.pem`)
	);
};

export const createClientCertificate = async (): Promise<ClientCertificate> => {
	const directory = await mkdtemp(join(tmpdir(), 'rocketchat-e2e-mtls-'));
	const alias = `rocketchat-e2e-${Date.now()}`;
	const password = 'e2e-certificate-password';
	const fileName = 'rocketchat-e2e-client.p12';
	const p12Path = join(directory, fileName);
	const certificateAuthorityPath = join(directory, 'ca.pem');

	await openssl(
		'req',
		'-x509',
		'-newkey',
		'rsa:2048',
		'-nodes',
		'-keyout',
		join(directory, 'ca.key'),
		'-out',
		certificateAuthorityPath,
		'-days',
		VALIDITY_DAYS,
		'-subj',
		`/CN=${alias} CA`
	);
	await signCertificate(
		directory,
		'server',
		'/CN=localhost',
		`subjectAltName=DNS:localhost,IP:${PROXY_HOST},IP:${ANDROID_EMULATOR_HOST_LOOPBACK}\nextendedKeyUsage=serverAuth\n`
	);
	await signCertificate(directory, 'client', `/CN=${alias}`, 'extendedKeyUsage=clientAuth\n');
	await openssl(
		'pkcs12',
		'-export',
		'-keypbe',
		'PBE-SHA1-3DES',
		'-certpbe',
		'PBE-SHA1-3DES',
		'-macalg',
		'sha1',
		'-inkey',
		join(directory, 'client.key'),
		'-in',
		join(directory, 'client.pem'),
		'-name',
		alias,
		'-passout',
		`pass:${password}`,
		'-out',
		p12Path
	);

	return { directory, alias, password, certificateAuthorityPath, p12Path, fileName };
};

export interface ClientCertificateProxy {
	url: (platform: string) => string;
	close: () => Promise<void>;
}

const UPSTREAM_HOST = new URL(data.server).host;

const forwardedHeaders = (headers: NodeJS.Dict<string | string[]>) => ({ ...headers, host: UPSTREAM_HOST });

const rawResponseHead = (statusCode: number, statusMessage: string, rawHeaders: string[]) => {
	const lines = [`HTTP/1.1 ${statusCode} ${statusMessage}`];
	for (let index = 0; index < rawHeaders.length; index += 2) {
		lines.push(`${rawHeaders[index]}: ${rawHeaders[index + 1]}`);
	}
	return `${lines.join('\r\n')}\r\n\r\n`;
};

const proxyRequests = (server: Server) => {
	server.on('request', (request, response) => {
		const upstream = httpsRequest(
			{ host: UPSTREAM_HOST, method: request.method, path: request.url, headers: forwardedHeaders(request.headers) },
			upstreamResponse => {
				response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.rawHeaders);
				upstreamResponse.pipe(response);
			}
		);
		upstream.on('error', () => response.destroy());
		request.pipe(upstream);
	});

	server.on('upgrade', (request, socket, head) => {
		const upstream = httpsRequest({
			host: UPSTREAM_HOST,
			method: request.method,
			path: request.url,
			headers: forwardedHeaders(request.headers)
		});
		upstream.on('upgrade', (upstreamResponse, upstreamSocket, upstreamHead) => {
			socket.write(
				rawResponseHead(upstreamResponse.statusCode ?? 101, upstreamResponse.statusMessage ?? '', upstreamResponse.rawHeaders)
			);
			socket.write(upstreamHead);
			upstreamSocket.write(head);
			upstreamSocket.pipe(socket).pipe(upstreamSocket);
			upstreamSocket.on('error', () => socket.destroy()).on('close', () => socket.destroy());
			socket.on('error', () => upstreamSocket.destroy()).on('close', () => upstreamSocket.destroy());
		});
		upstream.on('response', upstreamResponse => {
			socket.end(
				rawResponseHead(upstreamResponse.statusCode ?? 502, upstreamResponse.statusMessage ?? '', upstreamResponse.rawHeaders)
			);
		});
		upstream.on('error', () => socket.destroy());
		upstream.end();
	});
};

export const startClientCertificateProxy = async ({ directory }: ClientCertificate): Promise<ClientCertificateProxy> => {
	const server = createServer({
		key: await readFile(join(directory, 'server.key')),
		cert: await readFile(join(directory, 'server.pem')),
		ca: await readFile(join(directory, 'ca.pem')),
		requestCert: true,
		rejectUnauthorized: true
	});
	proxyRequests(server);
	const sockets = new Set<Socket>();
	server.on('secureConnection', socket => {
		sockets.add(socket);
		socket.on('close', () => sockets.delete(socket));
	});
	await new Promise<void>(resolve => server.listen(0, PROXY_HOST, resolve));
	const { port } = server.address() as AddressInfo;

	return {
		url: platform => `https://${platform === 'android' ? ANDROID_EMULATOR_HOST_LOOPBACK : 'localhost'}:${port}`,
		close: () =>
			new Promise(resolve => {
				server.close(() => resolve());
				sockets.forEach(socket => socket.destroy());
			})
	};
};

const androidSerial = () => process.env.E2E_ANDROID_DEVICE ?? 'emulator-5554';
const adb = (...args: string[]) => runCommand('adb', ['-s', androidSerial(), ...args]);

const iosDevice = () => process.env.E2E_IOS_DEVICE ?? 'iPhone 17 Pro';

interface SimulatorDevice {
	udid: string;
	name: string;
	state: string;
	dataPath: string;
}
const simctl = (...args: string[]) => runCommand('xcrun', ['simctl', ...args]);

const androidUserCertificateAuthorities = '/data/misc/user/0/cacerts-added';
const androidDownloads = '/sdcard/Download';

const androidCertificateAuthorityPath = async ({ certificateAuthorityPath }: ClientCertificate) => {
	const { stdout } = await openssl('x509', '-subject_hash_old', '-noout', '-in', certificateAuthorityPath);
	return `${androidUserCertificateAuthorities}/${stdout.trim()}.0`;
};

const FILES_LOCAL_STORAGE_GROUP = 'group.com.apple.FileProvider.LocalStorage';

const iosSimulator = async () => {
	const { stdout } = await simctl('list', 'devices', '--json');
	const devices = Object.values(JSON.parse(stdout).devices as Record<string, SimulatorDevice[]>).flat();
	const device = devices.find(({ udid, name, state }) => udid === iosDevice() || (name === iosDevice() && state === 'Booted'));
	if (!device) {
		throw new Error(`No simulator matches ${iosDevice()}`);
	}
	return device;
};

const containerIdentifier = async (container: string) => {
	const metadata = join(container, '.com.apple.mobile_container_manager.metadata.plist');
	const { stdout } = await runCommand('plutil', ['-extract', 'MCMMetadataIdentifier', 'raw', metadata]).catch(() => ({
		stdout: ''
	}));
	return stdout.trim();
};

const filesAppStorage = async () => {
	const appGroups = join((await iosSimulator()).dataPath, 'Containers', 'Shared', 'AppGroup');
	for (const container of await readdir(appGroups)) {
		if ((await containerIdentifier(join(appGroups, container))) === FILES_LOCAL_STORAGE_GROUP) {
			return join(appGroups, container, 'File Provider Storage');
		}
	}
	throw new Error('The simulator has no Files app local storage');
};

export const trustCertificateAuthority = async ({ platform }: Fixtures, certificate: ClientCertificate) => {
	if (platform === 'android') {
		const installedPath = await androidCertificateAuthorityPath(certificate);
		await adb('root');
		await adb('wait-for-device');
		await adb('push', certificate.certificateAuthorityPath, installedPath);
		await adb('shell', `chown system:system ${installedPath} && chmod 644 ${installedPath}`);
		return;
	}
	await simctl('keychain', (await iosSimulator()).udid, 'add-root-cert', certificate.certificateAuthorityPath);
};

const installAndroidClientCertificate = async ({ app, screen }: Fixtures, certificate: ClientCertificate) => {
	await adb('push', certificate.p12Path, `${androidDownloads}/${certificate.fileName}`);
	await adb('shell', 'am', 'start', '-a', 'android.credentials.INSTALL');
	await screen.getByLabel('Show roots').tap();
	await tapWhenUncovered(screen.getByText('Downloads'));
	await tapWhenUncovered(screen.getByText(certificate.fileName));
	await fillWhenUncovered(screen.getByTestId('com.android.certinstaller:id/credential_password'), certificate.password);
	await screen.getByRole('button', { name: /^OK$/i }).tap();
	await expect(screen.getByText('VPN & app user certificate')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^OK$/i }).tap();
	await expect(screen.getByText('Certificate name')).toBeVisible({ timeout: LONG_TIMEOUT });
	await screen.getByRole('button', { name: /^OK$/i }).tap();
	await expect(screen.getByText('Certificate name')).toBeHidden({ timeout: LONG_TIMEOUT });
	await app.open();
	await expect(screen.getByText('Add workspace')).toBeVisible({ timeout: LONG_TIMEOUT });
};

export const installClientCertificate = async (fixtures: Fixtures, certificate: ClientCertificate) => {
	if (fixtures.platform === 'android') {
		await installAndroidClientCertificate(fixtures, certificate);
		return;
	}
	const storage = await filesAppStorage();
	await mkdir(storage, { recursive: true });
	await copyFile(certificate.p12Path, join(storage, certificate.fileName));
};

export const removeClientCertificateFiles = async ({ platform }: Fixtures, certificate: ClientCertificate) => {
	if (platform === 'android') {
		await adb(
			'shell',
			'rm',
			'-f',
			await androidCertificateAuthorityPath(certificate),
			`${androidDownloads}/${certificate.fileName}`
		);
		return;
	}
	await rm(join(await filesAppStorage(), certificate.fileName), { force: true });
};

const IOS_DOCUMENT_PICKER_BROWSE_TAB = { x: 0.714, y: 0.938 };
const IOS_DOCUMENT_PICKER_ON_MY_IPHONE = { x: 0.311, y: 0.352 };
const IOS_DOCUMENT_PICKER_FIRST_FILE = { x: 0.174, y: 0.275 };

const pickFromIosDocumentPicker = async ({ device, screen }: Fixtures) => {
	const viewport = await device.locator('role=Application label="Rocket.Chat"').boundingBox();
	if (!viewport) {
		throw new Error('The app window has no bounding box');
	}
	const tapAtFraction = ({ x, y }: { x: number; y: number }) =>
		screen.tapAt({ x: viewport.x + viewport.width * x, y: viewport.y + viewport.height * y });
	await screen.getByTestId('new-server-choose-certificate').tap();
	await expect(screen.getByLabel('Cancel').first()).toBeVisible({ timeout: LONG_TIMEOUT });
	await tapAtFraction(IOS_DOCUMENT_PICKER_BROWSE_TAB);
	await tapAtFraction(IOS_DOCUMENT_PICKER_BROWSE_TAB);
	await tapAtFraction(IOS_DOCUMENT_PICKER_ON_MY_IPHONE);
	await tapAtFraction(IOS_DOCUMENT_PICKER_FIRST_FILE);
};

const PASSWORD_PROMPT_SUBMIT_ATTEMPTS = 3;
const PASSWORD_PROMPT_DISMISS_TIMEOUT = 5_000;

const submitPasswordPrompt = async ({ screen }: Fixtures) => {
	const passwordPrompt = screen.getByText('Certificate password');
	for (let attempt = 1; attempt <= PASSWORD_PROMPT_SUBMIT_ATTEMPTS; attempt += 1) {
		await screen.getByRole('button', { name: 'OK' }).tap();
		if (await succeeds(expect(passwordPrompt).toBeHidden({ timeout: PASSWORD_PROMPT_DISMISS_TIMEOUT }))) {
			return;
		}
	}
	await expect(passwordPrompt).toBeHidden();
};

export const chooseClientCertificate = async (fixtures: Fixtures, certificate: ClientCertificate) => {
	const { screen } = fixtures;
	if (fixtures.platform === 'android') {
		await screen.getByTestId('new-server-choose-certificate').tap();
		await tapWhenUncovered(screen.getByText(certificate.alias));
		await screen.getByRole('button', { name: /^Select$/i }).tap();
		await expect(screen.getByText(certificate.alias)).toBeVisible({ timeout: LONG_TIMEOUT });
		return;
	}
	await pickFromIosDocumentPicker(fixtures);
	await fillWhenUncovered(screen.getByPlaceholder('Password'), certificate.password);
	await submitPasswordPrompt(fixtures);
	await expect(screen.getByText('Your certificate')).toBeVisible({ timeout: LONG_TIMEOUT });
};

import { Alert, Platform, NativeModules } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import UserPreferences from '../userPreferences';
import I18n from '~/i18n';
import { extractHostname } from './server';
import { type ICertificate } from '~/definitions';
import { CERTIFICATE_KEY, CURRENT_SERVER } from '~/lib/constants/keys';
import NativeSSLPinningAndroid from '~/lib/native/NativeSSLPinningAndroid';
import { getAllServers } from '~/lib/database/services/Server';
import { store as reduxStore } from '~/lib/store/auxStore';
import log from './log';

const SSLPinning = Platform.select({
	android: NativeSSLPinningAndroid,
	ios: NativeModules.SSLPinning
});
const { documentDirectory } = FileSystem;

const extractFileScheme = (path: string) => path.replace('file://', ''); // file:// isn't allowed by obj-C

const getPath = (name: string) => `${documentDirectory}${name}`;

const SERVER_CERTIFICATE_PREFIX = `${CERTIFICATE_KEY}-`;

const getServerCertificateKey = (server: string) => `${SERVER_CERTIFICATE_PREFIX}${server}`;

const persistCertificate = (server: string, name: string, password?: string) => {
	const certificatePath = getPath(name);
	const certificate: ICertificate = {
		path: extractFileScheme(certificatePath),
		password
	};
	UserPreferences.setMap(name, certificate);
	const hostname = extractHostname(server);
	if (hostname) {
		UserPreferences.setMap(hostname, certificate);
	}
	UserPreferences.setString(getServerCertificateKey(server), name);
	return certificate;
};

export const getServerCertificate = (server: string): string | null => UserPreferences.getString(getServerCertificateKey(server));

const getServerIds = async () => (await getAllServers()).map(({ id }) => id);

const pickHostCertificates = (servers: string[]) => {
	const connected = reduxStore.getState().server.server || UserPreferences.getString(CURRENT_SERVER);
	const byHost = new Map<string, string>();
	servers
		.filter(id => getServerCertificate(id))
		.forEach(id => {
			const hostname = extractHostname(id);
			if (!byHost.has(hostname) || id === connected) {
				byHost.set(hostname, id);
			}
		});
	return [...byHost.values()];
};

const platformCertificate = Platform.select({
	ios: {
		forgetServer: (server: string) => SSLPinning?.removeWatchCertificate(server),
		releaseHost: () => {},
		register: async () => {}
	},
	android: {
		forgetServer: () => {},
		releaseHost: (server: string) => SSLPinning?.removeCertificate(server),
		register: async () => {
			await Promise.all(pickHostCertificates(await getServerIds()).map(applyServerCertificate));
		}
	}
});

const isCertificateInUse = (certificate: string) =>
	UserPreferences.getAllKeys().some(
		key => key.startsWith(SERVER_CERTIFICATE_PREFIX) && UserPreferences.getString(key) === certificate
	);

const forgetServerCertificate = (server: string) => {
	const certificate = getServerCertificate(server);
	UserPreferences.removeItem(getServerCertificateKey(server));
	if (certificate && !isCertificateInUse(certificate)) {
		UserPreferences.removeItem(certificate);
	}
	platformCertificate?.forgetServer(server);
	return certificate;
};

const syncHostCertificate = async (server: string, servers: string[]) => {
	const hostname = extractHostname(server);
	const [selected] = pickHostCertificates(servers.filter(id => extractHostname(id) === hostname));
	UserPreferences.removeItem(hostname);
	if (selected) {
		await applyServerCertificate(selected);
		return;
	}
	platformCertificate?.releaseHost(server);
};

const removeServerCertificate = async (server: string) => {
	forgetServerCertificate(server);
	await syncHostCertificate(server, await getServerIds());
};

export const clearRemovedWorkspaceCertificate = async (server: string): Promise<void> => {
	const servers = await getServerIds();
	if (servers.includes(server)) {
		return;
	}
	const certificate = forgetServerCertificate(server);
	const sameHost = servers.filter(id => extractHostname(id) === extractHostname(server));
	if (sameHost.length && (!certificate || !sameHost.some(id => getServerCertificate(id)))) {
		return;
	}
	await syncHostCertificate(server, servers);
};

const RCSSLPinning = Platform.select({
	ios: {
		pickCertificate: (server: string) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await DocumentPicker.getDocumentAsync({
						type: 'application/x-pkcs12'
					});
					if (res.canceled) {
						return reject();
					}
					const { uri, name } = res.assets[0];
					Alert.prompt(
						I18n.t('Certificate_password'),
						I18n.t('Whats_the_password_for_your_certificate'),
						[
							{
								text: 'OK',
								onPress: async (password?: string) => {
									try {
										const certificatePath = getPath(name);
										await FileSystem.copyAsync({ from: uri, to: certificatePath });
										const certificate = persistCertificate(server, name, password);
										SSLPinning?.setCertificate(server, certificate.path, password);
										resolve(name);
									} catch (e) {
										reject(e);
									}
								}
							}
						],
						'secure-text'
					);
				} catch (e) {
					reject(e);
				}
			}),
		setCertificate: (name: string, server: string) => {
			if (name) {
				const certificate = UserPreferences.getMap(name) as ICertificate;
				if (certificate) {
					persistCertificate(server, name, certificate.password);
					SSLPinning?.setCertificate(server, certificate.path, certificate.password);
				}
			}
		},
		removeCertificate: removeServerCertificate
	},
	android: {
		pickCertificate: () => SSLPinning?.pickCertificate(),
		setCertificate: (name: string, server: string) => SSLPinning?.setCertificate(name, server),
		removeCertificate: async (server: string) => {
			if (getServerCertificate(server)) {
				await removeServerCertificate(server);
			}
		}
	}
});

export const applyServerCertificate = async (server: string): Promise<void> => {
	const name = getServerCertificate(server);
	if (!name) {
		return;
	}
	try {
		await RCSSLPinning?.setCertificate(name, server);
	} catch (e) {
		log(e);
	}
};

export const registerCertificates = async (): Promise<void> => {
	try {
		await platformCertificate?.register();
	} catch (e) {
		log(e);
	}
};

export default RCSSLPinning;

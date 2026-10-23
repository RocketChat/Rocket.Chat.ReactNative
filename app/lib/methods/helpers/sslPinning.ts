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
import sdk from '~/lib/services/sdk';
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

const applyConnectedLast = async (servers: string[]) => {
	const connected = sdk.host ?? UserPreferences.getString(CURRENT_SERVER);
	const connectedLast = [...servers.filter(id => id !== connected), ...servers.filter(id => id === connected)];
	for (const id of connectedLast) {
		await applyServerCertificate(id);
	}
};

const isCertificateInUse = (certificate: string) =>
	UserPreferences.getAllKeys().some(
		key => key.startsWith(SERVER_CERTIFICATE_PREFIX) && UserPreferences.getString(key) === certificate
	);

const clearServerCertificate = async (server: string, servers: string[], keepForHost: boolean) => {
	const certificate = getServerCertificate(server);
	UserPreferences.removeItem(getServerCertificateKey(server));
	if (certificate && !isCertificateInUse(certificate)) {
		UserPreferences.removeItem(certificate);
	}
	const hostname = extractHostname(server);
	const sameHost = servers.filter(id => id !== server && extractHostname(id) === hostname);
	const withCertificate = sameHost.filter(id => getServerCertificate(id));
	if (keepForHost && sameHost.length && (!certificate || !withCertificate.length)) {
		return;
	}
	UserPreferences.removeItem(hostname);
	if (withCertificate.length) {
		await applyConnectedLast(withCertificate);
		return;
	}
	if (Platform.OS === 'android') {
		SSLPinning?.removeCertificate(server);
	}
};

const removeServerCertificate = async (server: string) => {
	if (!getServerCertificate(server)) {
		return;
	}
	await clearServerCertificate(server, await getServerIds(), false);
};

export const clearRemovedWorkspaceCertificate = async (server: string): Promise<void> => {
	const servers = await getServerIds();
	if (servers.includes(server)) {
		return;
	}
	await clearServerCertificate(server, servers, true);
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
		removeCertificate: removeServerCertificate
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
	if (Platform.OS !== 'android') {
		return;
	}
	try {
		await applyConnectedLast(await getServerIds());
	} catch (e) {
		log(e);
	}
};

export default RCSSLPinning;

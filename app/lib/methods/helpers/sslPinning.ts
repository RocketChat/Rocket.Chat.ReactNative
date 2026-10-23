import { Alert, Platform, NativeModules } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import UserPreferences from '../userPreferences';
import I18n from '~/i18n';
import { extractHostname } from './server';
import { type ICertificate } from '~/definitions';
import { CERTIFICATE_KEY } from '~/lib/constants/keys';
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
	UserPreferences.setString(`${SERVER_CERTIFICATE_PREFIX}${server}`, name);
	return certificate;
};

export const getServerCertificate = (server: string): string | null =>
	UserPreferences.getString(`${SERVER_CERTIFICATE_PREFIX}${server}`);

const getServersWithCertificate = () =>
	UserPreferences.getAllKeys()
		.filter(key => key.startsWith(SERVER_CERTIFICATE_PREFIX))
		.map(key => key.slice(SERVER_CERTIFICATE_PREFIX.length));

const clearStoredCertificate = (server: string) => {
	const certificate = getServerCertificate(server);
	UserPreferences.removeItem(`${SERVER_CERTIFICATE_PREFIX}${server}`);
	if (certificate && !getServersWithCertificate().some(other => getServerCertificate(other) === certificate)) {
		UserPreferences.removeItem(certificate);
	}
	UserPreferences.removeItem(extractHostname(server));
};

// The connected server goes last so it keeps the host's certificate
const restoreHostCertificates = async (server: string) => {
	const hostname = extractHostname(server);
	const servers = getServersWithCertificate().filter(other => extractHostname(other) === hostname);
	const ordered = [...servers.filter(other => other !== sdk.host), ...servers.filter(other => other === sdk.host)];
	await Promise.all(ordered.map(other => applyServerCertificate(other)));
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
		removeCertificate: async (server: string) => {
			clearStoredCertificate(server);
			await restoreHostCertificates(server);
		}
	},
	android: {
		pickCertificate: () => SSLPinning?.pickCertificate(),
		setCertificate: (name: string, server: string) => SSLPinning?.setCertificate(name, server),
		removeCertificate: async (server: string) => {
			clearStoredCertificate(server);
			SSLPinning?.removeCertificate(server);
			await restoreHostCertificates(server);
		}
	}
});

export const applyServerCertificate = async (server: string): Promise<void> => {
	const name = getServerCertificate(server);
	if (name) {
		await RCSSLPinning?.setCertificate(name, server);
	}
};

export const registerCertificates = async (): Promise<void> => {
	if (Platform.OS !== 'android') {
		return;
	}
	try {
		const servers = await getAllServers();
		await Promise.all(servers.map(({ id }) => applyServerCertificate(id)));
	} catch (e) {
		log(e);
	}
};

export default RCSSLPinning;

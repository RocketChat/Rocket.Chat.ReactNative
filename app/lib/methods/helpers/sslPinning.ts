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
	UserPreferences.setString(`${CERTIFICATE_KEY}-${server}`, name);
	return certificate;
};

export const getServerCertificate = (server: string): string | null => UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);

const isCertificateUsedElsewhere = (server: string, certificate: string) =>
	UserPreferences.getAllKeys().some(
		key =>
			key !== `${CERTIFICATE_KEY}-${server}` &&
			key.startsWith(`${CERTIFICATE_KEY}-`) &&
			UserPreferences.getString(key) === certificate
	);

const removeCertificate = (server: string) => {
	const certificate = getServerCertificate(server);
	if (certificate && !isCertificateUsedElsewhere(server, certificate)) {
		UserPreferences.removeItem(certificate);
	}
	UserPreferences.removeItem(extractHostname(server));
	UserPreferences.removeItem(`${CERTIFICATE_KEY}-${server}`);
};

const restoreConnectedCertificate = async () => {
	if (sdk.host) {
		await applyServerCertificate(sdk.host);
	}
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
			removeCertificate(server);
			await restoreConnectedCertificate();
		}
	},
	android: {
		pickCertificate: () => SSLPinning?.pickCertificate(),
		setCertificate: (name: string, server: string) => SSLPinning?.setCertificate(name, server),
		removeCertificate: async (server: string) => {
			removeCertificate(server);
			SSLPinning?.removeCertificate(server);
			await restoreConnectedCertificate();
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

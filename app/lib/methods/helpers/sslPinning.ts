import { Alert, Platform, NativeModules } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import UserPreferences from '../userPreferences';
import I18n from '../../../i18n';
import { extractHostname } from './server';
import { ICertificate } from '../../../definitions';
import { CERTIFICATE_KEY } from '../../constants';
import NativeSSLPinningAndroid from '../../native/NativeSSLPinningAndroid';

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
	UserPreferences.setMap(extractHostname(server), certificate);
	UserPreferences.setString(`${CERTIFICATE_KEY}-${server}`, name);
	return certificate;
};

const removeCertificate = (server: string) => {
	const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
	if (certificate) {
		UserPreferences.removeItem(certificate);
	}
	UserPreferences.removeItem(extractHostname(server));
	UserPreferences.removeItem(`${CERTIFICATE_KEY}-${server}`);
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
								onPress: async password => {
									try {
										const certificatePath = getPath(name);
										await FileSystem.copyAsync({ from: uri, to: certificatePath });
										persistCertificate(server, name, password);
										SSLPinning?.setCertificate(server, certificatePath, password);
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
				let certificate = UserPreferences.getMap(name) as ICertificate;
				if (!certificate.path.match(extractFileScheme(documentDirectory!))) {
					certificate = persistCertificate(server, name, certificate.password);
				}
				SSLPinning?.setCertificate(server, certificate.path, certificate.password);
			}
		},
		removeCertificate
	},
	android: {
		pickCertificate: () => SSLPinning?.pickCertificate(),
		setCertificate: name => SSLPinning?.setCertificate(name),
		removeCertificate
	}
});

export default RCSSLPinning;

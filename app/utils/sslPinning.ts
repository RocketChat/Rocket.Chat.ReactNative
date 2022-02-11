import { Alert, NativeModules, Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import * as FileSystem from 'expo-file-system';

import UserPreferences from '../lib/userPreferences';
import I18n from '../i18n';
import { extractHostname } from './server';
import { ICertificate } from '../definitions';

const { SSLPinning } = NativeModules;
const { documentDirectory } = FileSystem;

const extractFileScheme = (path: string) => path.replace('file://', ''); // file:// isn't allowed by obj-C

const getPath = (name: string) => `${documentDirectory}/${name}`;

const persistCertificate = async (name: string, password: string) => {
	const certificatePath = getPath(name);
	const certificate: ICertificate = {
		path: extractFileScheme(certificatePath),
		password
	};
	await UserPreferences.setMapAsync(name, certificate);
	return certificate;
};

const RCSSLPinning = Platform.select({
	ios: {
		pickCertificate: () =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await DocumentPicker.pick({
						// @ts-ignore
						type: ['com.rsa.pkcs-12']
					});
					const { uri, name } = res;
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
										await persistCertificate(name, password!);
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
		setCertificate: async (name: string, server: string) => {
			if (name) {
				let certificate = (await UserPreferences.getMapAsync(name)) as ICertificate;
				if (!certificate.path.match(extractFileScheme(documentDirectory!))) {
					certificate = await persistCertificate(name, certificate.password);
				}
				await UserPreferences.setMapAsync(extractHostname(server), certificate);
			}
		}
	},
	android: {
		pickCertificate: () => SSLPinning?.pickCertificate(),
		setCertificate: name => SSLPinning?.setCertificate(name)
	}
});

export default RCSSLPinning;

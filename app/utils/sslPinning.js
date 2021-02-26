import { NativeModules, Platform, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import * as FileSystem from 'expo-file-system';

import { extractHostname } from './server';
import UserPreferences from '../lib/userPreferences';
import I18n from '../i18n';

const { SSLPinning } = NativeModules;

const RCSSLPinning = Platform.select({
	ios: {
		pickCertificate: () => new Promise(async(resolve, reject) => {
			try {
				const res = await DocumentPicker.pick({
					type: ['com.rsa.pkcs-12']
				});
				const { uri, name } = res;
				Alert.prompt(
					I18n.t('Certificate_password'),
					I18n.t('Whats_the_password_for_your_certificate'),
					[
						{
							text: 'OK',
							onPress: async(password) => {
								try {
									const certificatePath = `${ FileSystem.documentDirectory }/${ name }`;

									await FileSystem.copyAsync({ from: uri, to: certificatePath });

									const certificate = {
										path: certificatePath.replace('file://', ''), // file:// isn't allowed by obj-C
										password
									};

									await UserPreferences.setMapAsync(name, certificate);

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
		setCertificate: async(alias, server) => {
			if (alias) {
				const certificate = await UserPreferences.getMapAsync(alias);
				await UserPreferences.setMapAsync(extractHostname(server), certificate);
			}
		}
	},
	android: {
		pickCertificate: () => SSLPinning?.pickCertificate(),
		setCertificate: alias => SSLPinning?.setCertificate(alias)
	}
});

export default RCSSLPinning;

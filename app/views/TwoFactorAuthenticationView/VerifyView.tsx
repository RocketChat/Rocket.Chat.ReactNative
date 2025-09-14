import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import Button from '../../containers/Button';
import { TextInput } from '../../containers/TextInput';
import { useTheme } from '../../theme';
import { verifyUserTotp } from '../../lib/services/restApi';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';

function TotpVerifyView() {
	const user = useAppSelector(state => getUserSelector(state));
	const navigation = useNavigation();
	const { colors, theme } = useTheme();
	const [code, setCode] = useState('');

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Two_Factor_Authentication')
		});

		Clipboard.getString().then(content => {
			if (/^\d{6}$/.test(content)) {
				setCode(content);
			}
		});
	}, []);

	const handleVerify = async () => {
		if (code.length !== 6) {
			alert(I18n.t('Invalid_Code'));
			return;
		}

		try {
			const result = await verifyUserTotp(code);
			const codes = result.codes;
			alert('Done');
		} catch (error) {
			// @ts-ignore
			if (error.error === '[invalid-totp]') {
				alert(I18n.t('Invalid_Code'));
				return;
			}
			console.log(error);
		}
	};

	return (
		<SafeAreaView>
			<View style={styles.content}>
				<Text style={[styles.title, { color: colors.fontDefault }]}>{I18n.t('Enter_6_digit_code')}</Text>

				<Text style={[styles.subtitle, { color: colors.fontDefault }]}>
					{I18n.t('Enter_the_code_from_your_authenticator_app')}
				</Text>

				<TextInput
					style={[
						styles.textInput,
						{ backgroundColor: colors.surfaceLight, color: colors.fontDefault, borderColor: colors.strokeLight }
					]}
					value={code}
					onChangeText={setCode}
					keyboardType='numeric'
					maxLength={6}
					placeholder='••••••'
					underlineColorAndroid='transparent'
					placeholderTextColor={colors.fontAnnotation}
					textAlign='center'
					keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
				/>
			</View>

			<Button
				title={I18n.t('Verify')}
				onPress={handleVerify}
				type='primary'
				testID='totp-verify-button'
				style={{ width: '95%', alignSelf: 'center' }}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20
	},
	content: {
		flex: 1,
		alignItems: 'center',
		paddingTop: 30
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 10,
		textAlign: 'center'
	},
	subtitle: {
		fontSize: 15,
		marginBottom: 30,
		textAlign: 'center'
	},
	textInput: {
		width: '95%',
		alignSelf: 'center',
		textAlign: 'center',
		paddingTop: 12,
		paddingBottom: 12,
		fontSize: 16,
		lineHeight: 22,
		borderWidth: 1
	}
});

export default TotpVerifyView;

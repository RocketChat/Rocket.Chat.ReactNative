import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { sha256 } from 'js-sha256';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';

import TextInput from '../TextInput';
import I18n from '../../i18n';
import EventEmitter from '../../utils/events';
import { withTheme } from '../../theme';
import { withSplit } from '../../split';
import { themes } from '../../constants/colors';
import Button from '../Button';
import sharedStyles from '../../views/Styles';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';

export const TWO_FACTOR = 'TWO_FACTOR';

const methods = {
	totp: {
		text: 'Open_your_authentication_app_and_enter_the_code',
		keyboardType: 'numeric'
	},
	email: {
		text: 'Verify_your_email_for_the_code_we_sent',
		keyboardType: 'numeric'
	},
	password: {
		title: 'Please_enter_your_password',
		text: 'For_your_security_you_must_enter_your_current_password_to_continue',
		secureTextEntry: true,
		keyboardType: 'default'
	}
};

const TwoFactor = React.memo(({ theme, split }) => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});
	const [code, setCode] = useState('');

	const method = methods[data.method];
	const isEmail = data.method === 'email';

	const sendEmail = () => RocketChat.sendEmailCode();

	useDeepCompareEffect(() => {
		if (!_.isEmpty(data)) {
			setCode('');
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showTwoFactor = args => setData(args);

	useEffect(() => {
		EventEmitter.addEventListener(TWO_FACTOR, showTwoFactor);

		return () => EventEmitter.removeListener(TWO_FACTOR);
	}, []);

	const onCancel = () => {
		const { cancel } = data;
		if (cancel) {
			cancel();
		}
		setData({});
	};

	const onSubmit = () => {
		const { submit } = data;
		if (submit) {
			if (data.method === 'password') {
				submit(sha256(code));
			} else {
				submit(code);
			}
		}
		setData({});
	};

	const color = themes[theme].titleText;
	return (
		<Modal
			transparent
			avoidKeyboard
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
		>
			<View style={styles.container}>
				<View style={[styles.content, split && [sharedStyles.modal, sharedStyles.modalFormSheet], { backgroundColor: themes[theme].backgroundColor }]}>
					<Text style={[styles.title, { color }]}>{I18n.t(method?.title || 'Two_Factor_Authentication')}</Text>
					{method?.text ? <Text style={[styles.subtitle, { color }]}>{I18n.t(method.text)}</Text> : null}
					<TextInput
						value={code}
						theme={theme}
						returnKeyType='send'
						autoCapitalize='none'
						onChangeText={setCode}
						onSubmitEditing={onSubmit}
						keyboardType={method?.keyboardType}
						secureTextEntry={method?.secureTextEntry}
						error={data.invalid && { error: 'totp-invalid', reason: I18n.t('Code_or_password_invalid') }}
					/>
					{isEmail && <Text style={[styles.sendEmail, { color }]} onPress={sendEmail}>{I18n.t('Send_me_the_code_again')}</Text>}
					<View style={styles.buttonContainer}>
						<Button
							title={I18n.t('Cancel')}
							type='secondary'
							backgroundColor={themes[theme].chatComponentBackground}
							style={styles.button}
							onPress={onCancel}
							theme={theme}
						/>
						<Button
							title={I18n.t('Send')}
							type='primary'
							style={styles.button}
							onPress={onSubmit}
							theme={theme}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
});
TwoFactor.propTypes = {
	theme: PropTypes.string,
	split: PropTypes.bool
};

export default withSplit(withTheme(TwoFactor));

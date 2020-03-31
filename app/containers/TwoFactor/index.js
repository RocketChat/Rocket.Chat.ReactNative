import React, { useEffect, useState } from 'react';
import { Modal, View, Text } from 'react-native';
import _ from 'lodash';
import PropTypes from 'prop-types';

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
		text: 'Open_your_authentication_app_and_enter_the_code'
	},
	email: {
		text: 'Verify_your_email_for_the_code_we_sent'
	},
	password: {
		title: 'Please_enter_your_password',
		text: 'For_your_security_you_must_enter_your_current_password_to_continue',
		secureTextEntry: true
	}
};

const TwoFactor = React.memo(({ theme, split }) => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});
	const [code, setCode] = useState('');

	const method = methods[data.method];
	const isEmail = data.method === 'email';

	const sendEmail = () => RocketChat.sendEmailCode();

	useEffect(() => {
		if (!_.isEmpty(data)) {
			if (isEmail) {
				sendEmail();
			}
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
		if (cancel?.onPress) {
			cancel.onPress();
		}
		setData({});
	};

	const onSubmit = () => {
		const { submit } = data;
		if (submit?.onPress) {
			submit.onPress(code);
		}
		setData({});
	};

	const color = themes[theme].titleText;
	return (
		<Modal visible={visible} transparent>
			<View style={[styles.container, { backgroundColor: `${ themes[theme].backdropColor }30` }]}>
				<View style={[styles.content, split && [sharedStyles.modal, sharedStyles.modalFormSheet], { backgroundColor: themes[theme].backgroundColor }]}>
					<Text style={[styles.title, { color }]}>{I18n.t(method?.title || 'Two_Factor_Authentication')}</Text>
					<Text style={[styles.subtitle, { color }]}>{I18n.t(method?.text)}</Text>
					<TextInput value={code} onChangeText={setCode} secureTextEntry={method?.secureTextEntry} />
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

import React, { useEffect, useState } from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet
} from 'react-native';
import _ from 'lodash';
import PropTypes from 'prop-types';

import TextInput from './TextInput';
import I18n from '../i18n';
import EventEmitter from '../utils/events';
import { withTheme } from '../theme';
import { withSplit } from '../split';
import { themes } from '../constants/colors';
import Button from './Button';
import sharedStyles from '../views/Styles';
import RocketChat from '../lib/rocketchat';

export const TWO_FACTOR = 'TWO_FACTOR';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		padding: 16,
		width: '90%',
		borderRadius: 4
	},
	title: {
		fontSize: 14,
		...sharedStyles.textBold
	},
	subtitle: {
		fontSize: 14,
		paddingVertical: 8,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	sendEmail: {
		fontSize: 14,
		paddingBottom: 24,
		paddingTop: 8,
		alignSelf: 'center',
		...sharedStyles.textRegular
	},
	button: {
		marginBottom: 0
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	}
});

const TwoFactor = React.memo(({ theme, split }) => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState({});
	const [code, setCode] = useState('');

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
					<Text style={[styles.title, { color }]}>{I18n.t('Two_Factor_Authentication')}</Text>
					<Text style={[styles.subtitle, { color }]}>
						{I18n.t(
							isEmail
								? 'Verify_your_email_for_the_code_we_sent'
								: 'Open_your_authentication_app_and_enter_the_code'
						)}
					</Text>
					<TextInput value={code} onChangeText={setCode} />
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

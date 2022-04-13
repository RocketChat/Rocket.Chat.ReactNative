import React, { useEffect, useState } from 'react';
import { InteractionManager, Text, View } from 'react-native';
import isEmpty from 'lodash/isEmpty';
import { sha256 } from 'js-sha256';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { connect } from 'react-redux';

import TextInput from '../TextInput';
import I18n from '../../i18n';
import EventEmitter from '../../utils/events';
import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import Button from '../Button';
import sharedStyles from '../../views/Styles';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';
import { IApplicationState } from '../../definitions';

export const TWO_FACTOR = 'TWO_FACTOR';

interface IMethodsProp {
	text: string;
	keyboardType: 'numeric' | 'default';
	title?: string;
	secureTextEntry?: boolean;
}
interface IMethods {
	totp: IMethodsProp;
	email: IMethodsProp;
	password: IMethodsProp;
}

interface EventListenerMethod {
	method?: keyof IMethods;
	submit?: (param: string) => void;
	cancel?: () => void;
	invalid?: boolean;
}

const methods: IMethods = {
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

const TwoFactor = React.memo(({ isMasterDetail }: { isMasterDetail: boolean }) => {
	const { theme } = useTheme();
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<EventListenerMethod>({});
	const [code, setCode] = useState<string>('');

	const method = data.method ? methods[data.method] : null;
	const isEmail = data.method === 'email';
	const sendEmail = () => RocketChat.sendEmailCode();

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setCode('');
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showTwoFactor = (args: EventListenerMethod) => setData(args);

	useEffect(() => {
		const listener = EventEmitter.addEventListener(TWO_FACTOR, showTwoFactor);

		return () => EventEmitter.removeListener(TWO_FACTOR, listener);
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
		<Modal avoidKeyboard useNativeDriver isVisible={visible} hideModalContentWhileAnimating>
			<View style={styles.container} testID='two-factor'>
				<View
					style={[
						styles.content,
						isMasterDetail && [sharedStyles.modalFormSheet, styles.tablet],
						{ backgroundColor: themes[theme].backgroundColor }
					]}>
					<Text style={[styles.title, { color }]}>{I18n.t(method?.title || 'Two_Factor_Authentication')}</Text>
					{method?.text ? <Text style={[styles.subtitle, { color }]}>{I18n.t(method.text)}</Text> : null}
					<TextInput
						value={code}
						theme={theme}
						inputRef={(e: any) => InteractionManager.runAfterInteractions(() => e?.getNativeRef()?.focus())}
						returnKeyType='send'
						autoCapitalize='none'
						onChangeText={setCode}
						onSubmitEditing={onSubmit}
						keyboardType={method?.keyboardType}
						secureTextEntry={method?.secureTextEntry}
						error={data.invalid ? { error: 'totp-invalid', reason: I18n.t('Code_or_password_invalid') } : undefined}
						testID='two-factor-input'
					/>
					{isEmail ? (
						<Text style={[styles.sendEmail, { color }]} onPress={sendEmail}>
							{I18n.t('Send_me_the_code_again')}
						</Text>
					) : null}
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
							testID='two-factor-send'
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
});

const mapStateToProps = (state: IApplicationState) => ({
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(TwoFactor);

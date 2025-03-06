import React, { useEffect, useState } from 'react';
import { InteractionManager, Text, View } from 'react-native';
import isEmpty from 'lodash/isEmpty';
import { sha256 } from 'js-sha256';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { FormTextInput } from '../TextInput';
import I18n from '../../i18n';
import EventEmitter from '../../lib/methods/helpers/events';
import { useTheme } from '../../theme';
import Button from '../Button';
import sharedStyles from '../../views/Styles';
import styles from './styles';
import { ICredentials } from '../../definitions';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import Toast from '../Toast';
import { showToast } from '../../lib/methods/helpers/showToast';
import log from '../../lib/methods/helpers/log';

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
	params?: ICredentials;
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
		text: 'Enter_the_code',
		keyboardType: 'numeric'
	},
	password: {
		title: 'Please_enter_your_password',
		text: 'For_your_security_you_must_enter_your_current_password_to_continue',
		secureTextEntry: true,
		keyboardType: 'default'
	}
};

const TwoFactor = React.memo(() => {
	const { colors } = useTheme();
	const { isMasterDetail } = useAppSelector(state => ({
		isMasterDetail: state.app.isMasterDetail as boolean
	}));
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<EventListenerMethod>({});
	const [code, setCode] = useState<string>('');

	const method = data.method ? methods[data.method] : null;
	const isEmail = data.method === 'email';
	const params = data?.params;

	const sendEmail = async () => {
		try {
			if (params?.user) {
				const response = await Services.sendEmailCode(params?.user);
				if (response.success) {
					showToast(I18n.t('Two_Factor_Success_message'));
				}
			}
		} catch (e) {
			log(e);
		}
	};

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setCode('');
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showTwoFactor = (args: EventListenerMethod) => {
		setData(args);
	};

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

	const color = colors.fontTitlesLabels;
	return (
		<Modal
			customBackdrop={<View aria-hidden style={[styles.overlay, { backgroundColor: colors.overlayBackground }]} />}
			avoidKeyboard
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating>
			<View style={styles.container} testID='two-factor'>
				<View
					style={[
						styles.content,
						isMasterDetail && [sharedStyles.modalFormSheet, styles.tablet],
						{ backgroundColor: colors.surfaceTint }
					]}>
					<Text style={[styles.title, { color }]}>{I18n.t(method?.title || 'Two_Factor_Authentication')}</Text>
					{method?.text ? <Text style={[styles.subtitle, { color }]}>{I18n.t(method.text)}</Text> : null}
					<FormTextInput
						returnKeyType='send'
						autoCapitalize='none'
						testID='two-factor-input'
						accessibilityLabel={I18n.t(
							data?.method === 'password' ? 'Label_Input_Two_Factor_Password' : 'Label_Input_Two_Factor_Code'
						)}
						value={code}
						inputRef={(e: any) => InteractionManager.runAfterInteractions(() => e?.getNativeRef()?.focus())}
						onChangeText={setCode}
						onSubmitEditing={onSubmit}
						keyboardType={method?.keyboardType}
						secureTextEntry={method?.secureTextEntry}
						error={data.invalid ? { error: 'totp-invalid', reason: I18n.t('Code_or_password_invalid') } : undefined}
						containerStyle={styles.containerInput}
					/>

					{isEmail ? (
						<Button
							small
							title={I18n.t('Resend_email')}
							style={[styles.button, { marginTop: 12 }]}
							type='secondary'
							onPress={sendEmail}
						/>
					) : null}
					<View style={styles.buttonContainer}>
						<Button title={I18n.t('Cancel')} type='secondary' style={styles.button} onPress={onCancel} />
						<Button title={I18n.t('Verify')} type='primary' style={styles.button} onPress={onSubmit} testID='two-factor-send' />
					</View>
				</View>
				<Toast />
			</View>
		</Modal>
	);
});

export default TwoFactor;

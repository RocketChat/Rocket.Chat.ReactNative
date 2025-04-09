import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { ANALYTICS_EVENTS_KEY, CRASH_REPORT_KEY } from '../../lib/constants';
import { useAppSelector } from '../../lib/hooks';
import useServer from '../../lib/methods/useServer';
import { SettingsStackParamList } from '../../stacks/types';
import { handleLocalAuthentication } from '../../lib/methods/helpers/localAuthentication';
import log, {
	events,
	getReportAnalyticsEventsValue,
	getReportCrashErrorsValue,
	logEvent,
	toggleAnalyticsEventsReport,
	toggleCrashErrorsReport
} from '../../lib/methods/helpers/log';
import Switch from '../../containers/Switch';
import sdk from '../../lib/services/sdk';
import { showErrorAlert } from '../../lib/methods/helpers';
import { getUserSelector } from '../../selectors/login';
import TOTPEnableModal from './TotpModel/TotpEnableModel';
import { sendLoadingEvent } from '../../containers/Loading';
import { twoFactor } from '../../lib/services/twoFactor';

interface ISecurityPrivacyViewProps {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'SecurityPrivacyView'>;
}

const SecurityPrivacyView = ({ navigation }: ISecurityPrivacyViewProps): JSX.Element => {
	const { e2eEnabled, user } = useAppSelector(state => ({
		e2eEnabled: state.settings.E2E_Enable,
		user: getUserSelector(state)
	}));
	const [state, setState] = useState({
		crashReportState: getReportCrashErrorsValue(),
		analyticsEventsState: getReportAnalyticsEventsValue(),
		totaState: false,
		showQrModel: false,
		qrUrls: '',
		secret: '',
		loading: false,
		backupCode: [],
		isEnabled: user?.services?.totp?.enabled as boolean,
		backupCodesRemaining: user?.services?.totp?.hashedBackup?.length as number
	});
	const [server] = useServer();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Security_and_privacy')
		});
	}, [navigation]);

	const toggleCrashReport = (value: boolean) => {
		logEvent(events.SP_TOGGLE_CRASH_REPORT);
		AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(value));
		setState(prevState => ({ ...prevState, crashReportState: value }));
		toggleCrashErrorsReport(value);
	};

	const toggleAnalyticsEvents = (value: boolean) => {
		logEvent(events.SP_TOGGLE_ANALYTICS_EVENTS);
		AsyncStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(value));
		setState(prevState => ({ ...prevState, analyticsEventsState: value }));
		toggleAnalyticsEventsReport(value);
	};

	const checkRemening = async () => {
		// {message: "{"msg":"method","id":"11","method":"2fa:checkCodesRemaining","params":[]}"}
		try {
			const payload = { msg: 'method', id: user.id, method: '2fa:checkCodesRemaining', params: [] };
			// @ts-ignore
			const result = await sdk.post('method.call/2fa:checkCodesRemaining', { message: JSON.stringify(payload) });
			console.log('result', result);
			if (result) {
				// @ts-ignore
				setState(prevState => ({ ...prevState, backupCodesRemaining: result?.remaining }));
			}
		} catch (error) {
			log(error);
		}
	};
	// @ts-ignore
	const toggleTOTP = async () => {
		// if (user?.services?.totp?.enabled) {
		// 	setState(prevState => ({ ...prevState, showQrModel: true }));
		// 	return;
		// }

		try {
			setState(prevState => ({ ...prevState, loading: true }));
			const payload = { msg: 'method', id: user.id, method: '2fa:enable', params: [] };
			// @ts-ignore
			const result = await sdk.post('method.call/2fa:enable', { message: JSON.stringify(payload) });
			// @ts-ignore
			if (result?.secret === null) {
				// @ts-ignore
				const messageError = result?.message?.message;
				showErrorAlert(messageError, 'Error');
			} else {
				// @ts-ignore
				console.log('result?.url', result?.url);
				// @ts-ignore
				if (result?.url) {
					// @ts-ignore
					setState(prevState => ({
						...prevState,
						isEnabled: false,
						showQrModel: true,
						// @ts-ignore
						qrUrls: result?.url,
						// @ts-ignore
						secret: result?.secret
					}));
				} else {
					setState(prevState => ({ ...prevState, isEnabled: true, backupCode: [] }));
				}
				// @ts-ignore
				setState(prevState => ({ ...prevState, showQrModel: true }));
			}
			setState(prevState => ({ ...prevState, loading: false }));
		} catch (error) {
			setState(prevState => ({ ...prevState, loading: false, showQrModel: true, backupCode: [], isEnabled: true }));
			// @ts-ignore
			// showErrorAlert(error?.error as string, 'Error');
			log(error);
		}
	};

	const onTotaverify = async (code: string) => {
		try {
			const payload = { msg: 'method', id: user.id, method: '2fa:validateTempToken', params: [code] };

			// @ts-ignore
			const result = await sdk.post('method.call/2fa:validateTempToken', { message: JSON.stringify(payload) });
			console.log('result', result);
			// @ts-ignore
			if (!result?.codes?.length) {
				// @ts-ignore
				const messageError = result?.message?.error;
				showErrorAlert(messageError);
			} else {
				// @ts-ignore
				setState(prevState => ({ ...prevState, backupCode: result?.codes, showQrModel: true }));
			}
		} catch (error) {
			setState(prevState => ({ ...prevState, showQrModel: false }));
			log(error);
			console.log('error', error);
			// @ts-ignore
			showErrorAlert(error?.error, 'Error');
		}
	};

	const totpregenerate = async () => {
		setState(prevState => ({ ...prevState, showQrModel: false }));
		try {
			const code = await twoFactor({ method: 'totp', invalid: false });
			if (code) {
				const payload = { msg: 'method', id: user.id, method: '2fa:regenerateCodes', params: [code.twoFactorCode] };

				setState(prevState => ({ ...prevState, loading: true }));
				// @ts-ignore
				const result = await sdk.post('method.call/2fa:regenerateCodes', { message: JSON.stringify(payload) });
				// @ts-ignore
				if (result?.codes) {
					// @ts-ignore
					setState(prevState => ({ ...prevState, backupCode: result?.codes, showQrModel: true }));
				} else {
					showErrorAlert('An error occurred. Please try again.', 'Error');
				}
				setState(prevState => ({ ...prevState, loading: false }));
			}
		} catch (error) {
			// do nothing
			setState(prevState => ({ ...prevState, loading: false }));
		}
	};

	const onDisableTotp = async () => {
		setState(prevState => ({ ...prevState, showQrModel: false }));
		try {
			const code = await twoFactor({ method: 'totp', invalid: false });
			if (code) {
				const payload = { msg: 'method', id: user.id, method: '2fa:disable', params: [code.twoFactorCode] };

				setState(prevState => ({ ...prevState, loading: true }));
				// @ts-ignore
				const result = await sdk.post('method.call/2fa:disable', { message: JSON.stringify(payload) });
				console.log('result', result);
				// @ts-ignore
				if (!result) {
					showErrorAlert('An error occurred. Please try again.', 'Error');
				} else {
					showErrorAlert('Successfully disabled TOTP.', 'Success');
				}
			}

			setState(prevState => ({ ...prevState, loading: false }));
		} catch (error) {
			console.log('error', error);
			setState(prevState => ({ ...prevState, loading: false }));
		}
	};

	const navigateToScreen = (screen: 'E2EEncryptionSecurityView' | 'ScreenLockConfigView') => {
		// @ts-ignore
		logEvent(events[`SP_GO_${screen.replace('View', '').toUpperCase()}`]);
		navigation.navigate(screen);
	};

	const navigateToScreenLockConfigView = async () => {
		if (server?.autoLock) {
			await handleLocalAuthentication(true);
		}
		navigateToScreen('ScreenLockConfigView');
	};
	useEffect(() => {
		checkRemening();
	}, []);
	useEffect(() => {
		sendLoadingEvent({ visible: state.loading });
	}, [state.loading]);
	return (
		<SafeAreaView testID='security-privacy-view'>
			<StatusBar />
			<List.Container testID='security-privacy-view-list'>
				<List.Section>
					<List.Separator />
					{e2eEnabled ? (
						<>
							<List.Item
								title='E2E_Encryption'
								showActionIndicator
								onPress={() => navigateToScreen('E2EEncryptionSecurityView')}
								testID='security-privacy-view-e2e-encryption'
							/>
							<List.Separator />
						</>
					) : null}
					<List.Item
						title='Screen_lock'
						showActionIndicator
						onPress={navigateToScreenLockConfigView}
						testID='security-privacy-view-screen-lock'
					/>
					<List.Separator />
				</List.Section>

				<List.Section>
					<List.Separator />
					<List.Item
						showActionIndicator
						title='Enable_Two_factor_authentication_via_TOTP'
						testID='security-privacy-view-enable-two-factor-authentication'
						onPress={toggleTOTP}
						additionalAcessibilityLabel={state.totaState}
					/>
					<List.Item
						title='Log_analytics_events'
						testID='security-privacy-view-analytics-events'
						right={() => <Switch value={state.analyticsEventsState} onValueChange={toggleAnalyticsEvents} />}
						additionalAcessibilityLabel={state.analyticsEventsState}
					/>
					<List.Separator />
					<List.Item
						title='Send_crash_report'
						testID='security-privacy-view-crash-report'
						right={() => <Switch value={state.crashReportState} onValueChange={toggleCrashReport} />}
						additionalAcessibilityLabel={state.analyticsEventsState}
					/>
					<List.Separator />
					<List.Info info='Crash_report_disclaimer' />
				</List.Section>
			</List.Container>

			<TOTPEnableModal
				onDisable={onDisableTotp}
				onRegenerateCodes={totpregenerate}
				isEnabled={state.isEnabled}
				backupCodesRemaining={state.backupCodesRemaining}
				open={state.showQrModel}
				onClose={() => setState(prevState => ({ ...prevState, showQrModel: false }))}
				manualCode={state.secret}
				qrCodeValue={state.qrUrls}
				onVerify={code => onTotaverify(code)}
				showBackupKeys={state.backupCode?.length >= 1}
				backupKeys={state.backupCode?.join(' ')}
			/>
		</SafeAreaView>
	);
};

export default SecurityPrivacyView;

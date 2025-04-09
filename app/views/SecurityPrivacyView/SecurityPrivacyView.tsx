import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';

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
import CustomModal from '../../containers/Model/CustomModel';
import TOTPEnableModal from './TotaModel/TotaEnableModel';

interface ISecurityPrivacyViewProps {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'SecurityPrivacyView'>;
}

const SecurityPrivacyView = ({ navigation }: ISecurityPrivacyViewProps): JSX.Element => {
	const [crashReportState, setCrashReportState] = useState(getReportCrashErrorsValue());
	const [analyticsEventsState, setAnalyticsEventsState] = useState(getReportAnalyticsEventsValue());
	const [totaState, setTotaState] = useState(false);
	const [showQrModel, setShowQrModel] = useState(false);
	const [qrUrls, setQrUrls] = useState('');
	const [secret, setSecret] = useState('');
	const [server] = useServer();

	const { e2eEnabled, user } = useAppSelector(state => ({
		e2eEnabled: state.settings.E2E_Enable,
		user: getUserSelector(state)
	}));

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Security_and_privacy')
		});
	}, [navigation]);

	const toggleCrashReport = (value: boolean) => {
		logEvent(events.SP_TOGGLE_CRASH_REPORT);
		AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(value));
		setCrashReportState(value);
		toggleCrashErrorsReport(value);
	};

	const toggleAnalyticsEvents = (value: boolean) => {
		logEvent(events.SP_TOGGLE_ANALYTICS_EVENTS);
		AsyncStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(value));
		setAnalyticsEventsState(value);
		toggleAnalyticsEventsReport(value);
	};
	// @ts-ignore
	const toggleTOTP = async (value: boolean) => {
		let payload = { msg: 'method', id: '121', method: '2fa:enable', params: [] };

		try {
			// @ts-ignore
			const result = await sdk.post('method.call/2fa:enable', { message: JSON.stringify(payload) });
			// @ts-ignore
			if (result?.secret === null) {
				// @ts-ignore
				const messageError = result?.message?.message;
				showErrorAlert(messageError);
			} else {
				// @ts-ignore
				setQrUrls(result?.url);
				// @ts-ignore
				setSecret(result?.secret);
				setShowQrModel(true);
			}
		} catch (error) {
			log(error);
		}
	};

	const onTotaverify = async (code: string) => {
		console.log('code', code);
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
						title='Enable_Two_factor_authentication_via_TOTP'
						testID='security-privacy-view-enable-two-factor-authentication'
						right={() => <Switch value={totaState} onValueChange={toggleTOTP} />}
						additionalAcessibilityLabel={totaState}
					/>
					<List.Item
						title='Log_analytics_events'
						testID='security-privacy-view-analytics-events'
						right={() => <Switch value={analyticsEventsState} onValueChange={toggleAnalyticsEvents} />}
						additionalAcessibilityLabel={analyticsEventsState}
					/>
					<List.Separator />
					<List.Item
						title='Send_crash_report'
						testID='security-privacy-view-crash-report'
						right={() => <Switch value={crashReportState} onValueChange={toggleCrashReport} />}
						additionalAcessibilityLabel={analyticsEventsState}
					/>
					<List.Separator />
					<List.Info info='Crash_report_disclaimer' />
				</List.Section>
			</List.Container>

			<TOTPEnableModal
				open={showQrModel}
				onClose={() => setShowQrModel(false)}
				manualCode={secret}
				qrCodeValue={qrUrls}
				onVerify={code => onTotaverify(code)}
			/>
		</SafeAreaView>
	);
};

export default SecurityPrivacyView;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import I18n from '../i18n';
import { ANALYTICS_EVENTS_KEY, CRASH_REPORT_KEY, isFDroidBuild } from '../lib/constants';
import { useAppSelector } from '../lib/hooks';
import useServer from '../lib/methods/useServer';
import { SettingsStackParamList } from '../stacks/types';
import { handleLocalAuthentication } from '../lib/methods/helpers/localAuthentication';
import {
	events,
	getReportAnalyticsEventsValue,
	getReportCrashErrorsValue,
	logEvent,
	toggleAnalyticsEventsReport,
	toggleCrashErrorsReport
} from '../lib/methods/helpers/log';
import Switch from '../containers/Switch';

interface ISecurityPrivacyViewProps {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'SecurityPrivacyView'>;
}

const SecurityPrivacyView = ({ navigation }: ISecurityPrivacyViewProps): JSX.Element => {
	const [crashReportState, setCrashReportState] = useState(getReportCrashErrorsValue());
	const [analyticsEventsState, setAnalyticsEventsState] = useState(getReportAnalyticsEventsValue());
	const [server] = useServer();

	const e2eEnabled = useAppSelector(state => state.settings.E2E_Enable);

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

				{!isFDroidBuild ? (
					<>
						<List.Section>
							<List.Separator />
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
					</>
				) : null}
			</List.Container>
		</SafeAreaView>
	);
};

export default SecurityPrivacyView;

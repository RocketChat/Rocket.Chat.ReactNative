import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { ANALYTICS_EVENTS_KEY, CRASH_REPORT_KEY } from '../lib/constants';
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
import { getUserSelector } from '../selectors/login';
import { getMe } from '../lib/services/restApi';
import { IUser } from '../definitions';

interface ISecurityPrivacyViewProps {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'SecurityPrivacyView'>;
}

const SecurityPrivacyView = ({ navigation }: ISecurityPrivacyViewProps): JSX.Element => {
	const [crashReportState, setCrashReportState] = useState(getReportCrashErrorsValue());
	const [analyticsEventsState, setAnalyticsEventsState] = useState(getReportAnalyticsEventsValue());
	const [server] = useServer();

	const e2eEnabled = useAppSelector(state => state.settings.E2E_Enable);
	const user = useAppSelector(state => getUserSelector(state));

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

	const navigateToScreen = (screen: 'E2EEncryptionSecurityView' | 'ScreenLockConfigView' | 'TotpView') => {
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

    const navigateToTotpView = async () => {
        navigateToScreen('TotpView');
    };

	return (
		<SafeAreaView testID='security-privacy-view'>
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
						title={user.services?.totp?.enabled ? 'remove_authenticator_app' : 'add_authenticator_app'}
						showActionIndicator
						onPress={navigateToTotpView}
						testID='security-privacy-view-screen-lock'
					/>
					<List.Separator />
                    {
                        user.services?.totp?.enabled ? (
                            <>
                                <List.Item
                                    title={'view_backup_codes'}
                                    showActionIndicator
                                    onPress={navigateToScreenLockConfigView}
                                    testID='security-privacy-view-screen-lock'
                                />
                                <List.Separator />
                            </>
                        ) : null
                    }
                    <List.Item
						title='email_two_factor_authentication'
						testID='security-privacy-view-analytics-events'
						right={() => <Switch value={user?.services?.email2fa?.enabled || false} onValueChange={toggleAnalyticsEvents} />}
						additionalAcessibilityLabel={analyticsEventsState}
					/>
					<List.Separator />
				</List.Section>

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
			</List.Container>
		</SafeAreaView>
	);
};

export default SecurityPrivacyView;

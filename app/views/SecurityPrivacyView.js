import React, { useEffect, useState } from 'react';
import { Switch } from 'react-native';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-community/async-storage';
import { useSelector } from 'react-redux';

import { SWITCH_TRACK_COLOR } from '../constants/colors';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import I18n from '../i18n';
import { CRASH_REPORT_KEY, ANALYTICS_EVENTS_KEY } from '../lib/rocketchat';
import {
	logEvent,
	events,
	toggleCrashErrorsReport,
	toggleAnalyticsEventsReport,
	getReportCrashErrorsValue,
	getReportAnalyticsEventsValue
} from '../utils/log';
import SafeAreaView from '../containers/SafeAreaView';
import { isFDroidBuild } from '../constants/environment';

const SecurityPrivacyView = ({ navigation }) => {
	const [crashReportState, setCrashReportState] = useState(getReportCrashErrorsValue());
	const [analyticsEventsState, setAnalyticsEventsState] = useState(getReportAnalyticsEventsValue());

	const e2eEnabled = useSelector(state => state.settings.E2E_Enable);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Security_and_privacy')
		});
	}, []);

	const toggleCrashReport = value => {
		logEvent(events.SE_TOGGLE_CRASH_REPORT);
		AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(value));
		setCrashReportState(value);
		toggleCrashErrorsReport(value);
	};

	const toggleAnalyticsEvents = value => {
		logEvent(events.SE_TOGGLE_ANALYTICS_EVENTS);
		AsyncStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(value));
		setAnalyticsEventsState(value);
		toggleAnalyticsEventsReport(value);
	};

	const navigateToScreen = screen => {
		logEvent(events[`SP_GO_${screen.replace('View', '').toUpperCase()}`]);
		navigation.navigate(screen);
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
						onPress={() => navigateToScreen('ScreenLockConfigView')}
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
								right={() => (
									<Switch value={analyticsEventsState} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleAnalyticsEvents} />
								)}
							/>
							<List.Separator />
							<List.Item
								title='Send_crash_report'
								testID='security-privacy-view-crash-report'
								right={() => (
									<Switch value={crashReportState} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleCrashReport} />
								)}
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

SecurityPrivacyView.propTypes = {
	navigation: PropTypes.object
};

export default SecurityPrivacyView;

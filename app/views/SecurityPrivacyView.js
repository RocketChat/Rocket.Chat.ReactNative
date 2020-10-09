import React from 'react';
import { Switch } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';

import { toggleCrashReport as toggleCrashReportAction, toggleAnalyticsEvents as toggleAnalyticsEventsAction } from '../actions/crashReport';
import { SWITCH_TRACK_COLOR } from '../constants/colors';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import I18n from '../i18n';
import { CRASH_REPORT_KEY, ANALYTICS_EVENTS_KEY } from '../lib/rocketchat';
import {
	loggerConfig, analytics, logEvent, events
} from '../utils/log';
import SafeAreaView from '../containers/SafeAreaView';
import { isFDroidBuild } from '../constants/environment';
import { getUserSelector } from '../selectors/login';

class SecurityPrivacyView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Security_and_privacy')
	});

	static propTypes = {
		navigation: PropTypes.object,
		allowCrashReport: PropTypes.bool,
		allowAnalyticsEvents: PropTypes.bool,
		e2eEnabled: PropTypes.bool,
		toggleCrashReport: PropTypes.func,
		toggleAnalyticsEvents: PropTypes.func,
		user: PropTypes.shape({
			roles: PropTypes.array,
			id: PropTypes.string
		})
	}

	toggleCrashReport = (value) => {
		logEvent(events.SE_TOGGLE_CRASH_REPORT);
		AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(value));
		const { toggleCrashReport } = this.props;
		toggleCrashReport(value);
		if (!isFDroidBuild) {
			loggerConfig.autoNotify = value;
			if (value) {
				loggerConfig.clearBeforeSendCallbacks();
			} else {
				loggerConfig.registerBeforeSendCallback(() => false);
			}
		}
	}

	toggleAnalyticsEvents = (value) => {
		logEvent(events.SE_TOGGLE_ANALYTICS_EVENTS);
		const { toggleAnalyticsEvents } = this.props;
		AsyncStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(value));
		toggleAnalyticsEvents(value);
		analytics().setAnalyticsCollectionEnabled(value);
	}

	navigateToScreen = (screen) => {
		logEvent(events[`SP_GO_${ screen.replace('View', '').toUpperCase() }`]);
		const { navigation } = this.props;
		navigation.navigate(screen);
	}

	renderCrashReportSwitch = () => {
		const { allowCrashReport } = this.props;
		return (
			<Switch
				value={allowCrashReport}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleCrashReport}
			/>
		);
	}

	renderAnalyticsEventsSwitch = () => {
		const { allowAnalyticsEvents } = this.props;
		return (
			<Switch
				value={allowAnalyticsEvents}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleAnalyticsEvents}
			/>
		);
	}

	render() {
		const { e2eEnabled } = this.props;
		return (
			<SafeAreaView testID='security-privacy-view'>
				<StatusBar />
				<List.Container testID='security-privacy-view-list'>
					<List.Section>
						<List.Separator />
						{e2eEnabled
							? (
								<>
									<List.Item
										title='E2E_Encryption'
										showActionIndicator
										onPress={() => this.navigateToScreen('E2EEncryptionSecurityView')}
										testID='security-privacy-view-e2e-encryption'
									/>
									<List.Separator />
								</>
							)
							: null
						}
						<List.Item
							title='Screen_lock'
							showActionIndicator
							onPress={() => this.navigateToScreen('ScreenLockConfigView')}
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
									right={() => this.renderAnalyticsEventsSwitch()}
								/>
								<List.Separator />
								<List.Item
									title='Send_crash_report'
									testID='security-privacy-view-crash-report'
									right={() => this.renderCrashReportSwitch()}
								/>
								<List.Separator />
								<List.Info info='Crash_report_disclaimer' />
							</List.Section>
						</>
					) : null}
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	allowCrashReport: state.crashReport.allowCrashReport,
	allowAnalyticsEvents: state.crashReport.allowAnalyticsEvents,
	e2eEnabled: state.settings.E2E_Enable
});

const mapDispatchToProps = dispatch => ({
	toggleCrashReport: params => dispatch(toggleCrashReportAction(params)),
	toggleAnalyticsEvents: params => dispatch(toggleAnalyticsEventsAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(SecurityPrivacyView);

import React from 'react';
import { View, ScrollView, Switch } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';

import { toggleCrashReport as toggleCrashReportAction, toggleAnalyticsEvents as toggleAnalyticsEventsAction } from '../../actions/crashReport';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import ItemInfo from '../../containers/ItemInfo';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import { CRASH_REPORT_KEY, ANALYTICS_EVENTS_KEY } from '../../lib/rocketchat';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import {
	loggerConfig, analytics, logEvent, events
} from '../../utils/log';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { isFDroidBuild } from '../../constants/environment';
import { getUserSelector } from '../../selectors/login';


const SectionSeparator = React.memo(({ theme }) => (
	<View
		style={[
			styles.sectionSeparatorBorder,
			{
				borderColor: themes[theme].separatorColor,
				backgroundColor: themes[theme].auxiliaryBackground
			}
		]}
	/>
));
SectionSeparator.propTypes = {
	theme: PropTypes.string
};

class SecurityPrivacyView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Security_and_Privacy')
	});

	static propTypes = {
		navigation: PropTypes.object,
		allowCrashReport: PropTypes.bool,
		allowAnalyticsEvents: PropTypes.bool,
		toggleCrashReport: PropTypes.func,
		toggleAnalyticsEvents: PropTypes.func,
		theme: PropTypes.string,
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
		logEvent(events[`SE_GO_${ screen.replace('View', '').toUpperCase() }`]);
		const { navigation } = this.props;
		navigation.navigate(screen);
	}

	renderDisclosure = () => {
		const { theme } = this.props;
		return <DisclosureImage theme={theme} />;
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
		const { theme } = this.props;
		return (
			<SafeAreaView testID='settings-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.listPadding}
					showsVerticalScrollIndicator={false}
					testID='settings-view-list'
				>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('E2E_Encryption')}
						showActionIndicator
						onPress={() => this.navigateToScreen('ThemeView')}
						testID='settings-view-e2e-encryption'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Screen_lock')}
						showActionIndicator
						onPress={() => this.navigateToScreen('ScreenLockConfigView')}
						right={this.renderDisclosure}
						theme={theme}
					/>

					<SectionSeparator theme={theme} />

					{!isFDroidBuild ? (
						<>
							<ListItem
								title={I18n.t('Log_analytics_events')}
								testID='settings-view-analytics-events'
								right={() => this.renderAnalyticsEventsSwitch()}
								theme={theme}
							/>
							<Separator theme={theme} />
							<ListItem
								title={I18n.t('Send_crash_report')}
								testID='settings-view-crash-report'
								right={() => this.renderCrashReportSwitch()}
								theme={theme}
							/>
							<Separator theme={theme} />
							<ItemInfo
								info={I18n.t('Crash_report_disclaimer')}
								theme={theme}
							/>
						</>
					) : null}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	allowCrashReport: state.crashReport.allowCrashReport,
	allowAnalyticsEvents: state.crashReport.allowAnalyticsEvents
});

const mapDispatchToProps = dispatch => ({
	toggleCrashReport: params => dispatch(toggleCrashReportAction(params)),
	toggleAnalyticsEvents: params => dispatch(toggleAnalyticsEventsAction(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SecurityPrivacyView));

import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Switch, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes, SWITCH_TRACK_COLOR } from '../constants/colors';
import StatusBar from '../containers/StatusBar';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import ItemInfo from '../containers/ItemInfo';
import { CustomIcon } from '../lib/Icons';
import database from '../lib/database';
import { supportedBiometryLabel, changePasscode, checkHasPasscode } from '../utils/localAuthentication';
import { DisclosureImage } from '../containers/DisclosureIndicator';
import { DEFAULT_AUTO_LOCK } from '../constants/localAuthentication';
import SafeAreaView from '../containers/SafeAreaView';
import { events, logEvent } from '../utils/log';

const styles = StyleSheet.create({
	listPadding: {
		paddingVertical: 36
	},
	emptySpace: {
		marginTop: 36
	}
});

const DEFAULT_BIOMETRY = false;

class ScreenLockConfigView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Screen_lock')
	};

	static propTypes = {
		theme: PropTypes.string,
		server: PropTypes.string,
		Force_Screen_Lock: PropTypes.string,
		Force_Screen_Lock_After: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			autoLock: false,
			autoLockTime: null,
			biometry: DEFAULT_BIOMETRY,
			biometryLabel: null
		};
		this.init();
	}

	componentWillUnmount() {
		if (this.observable && this.observable.unsubscribe) {
			this.observable.unsubscribe();
		}
	}

	defaultAutoLockOptions = [
		{
			title: I18n.t('Local_authentication_auto_lock_60'),
			value: 60
		},
		{
			title: I18n.t('Local_authentication_auto_lock_300'),
			value: 300
		},
		{
			title: I18n.t('Local_authentication_auto_lock_900'),
			value: 900
		},
		{
			title: I18n.t('Local_authentication_auto_lock_1800'),
			value: 1800
		},
		{
			title: I18n.t('Local_authentication_auto_lock_3600'),
			value: 3600
		}
	];

	init = async() => {
		const { server } = this.props;
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		try {
			this.serverRecord = await serversCollection.find(server);
			this.setState({
				autoLock: this.serverRecord?.autoLock,
				autoLockTime: this.serverRecord?.autoLockTime === null ? DEFAULT_AUTO_LOCK : this.serverRecord?.autoLockTime,
				biometry: this.serverRecord.biometry === null ? DEFAULT_BIOMETRY : this.serverRecord.biometry
			});
		} catch (error) {
			// Do nothing
		}

		const biometryLabel = await supportedBiometryLabel();
		this.setState({ biometryLabel });

		this.observe();
	}

	/*
	 * We should observe biometry value
	 * because it can be changed by PasscodeChange
	 * when the user set his first passcode
	*/
	observe = () => {
		this.observable = this.serverRecord?.observe()?.subscribe(({ biometry }) => {
			this.setState({ biometry });
		});
	}

	save = async() => {
		logEvent(events.SLC_SAVE_SCREEN_LOCK);
		const { autoLock, autoLockTime, biometry } = this.state;
		const serversDB = database.servers;
		await serversDB.action(async() => {
			await this.serverRecord?.update((record) => {
				record.autoLock = autoLock;
				record.autoLockTime = autoLockTime === null ? DEFAULT_AUTO_LOCK : autoLockTime;
				record.biometry = biometry === null ? DEFAULT_BIOMETRY : biometry;
			});
		});
	}

	changePasscode = async({ force }) => {
		logEvent(events.SLC_CHANGE_PASSCODE);
		await changePasscode({ force });
	}

	toggleAutoLock = () => {
		logEvent(events.SLC_TOGGLE_AUTOLOCK);
		this.setState(({ autoLock }) => ({ autoLock: !autoLock, autoLockTime: DEFAULT_AUTO_LOCK }), async() => {
			const { autoLock } = this.state;
			if (autoLock) {
				try {
					await checkHasPasscode({ force: false, serverRecord: this.serverRecord });
				} catch {
					this.toggleAutoLock();
				}
			}
			this.save();
		});
	}

	toggleBiometry = () => {
		logEvent(events.SLC_TOGGLE_BIOMETRY);
		this.setState(({ biometry }) => ({ biometry: !biometry }), () => this.save());
	}

	isSelected = (value) => {
		const { autoLockTime } = this.state;
		return autoLockTime === value;
	}

	changeAutoLockTime = (autoLockTime) => {
		logEvent(events.SLC_CHANGE_AUTOLOCK_TIME);
		this.setState({ autoLockTime }, () => this.save());
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} color={themes[theme].tintColor} />;
	}

	renderItem = ({ item }) => {
		const { theme } = this.props;
		const { title, value, disabled } = item;
		return (
			<>
				<ListItem
					title={title}
					onPress={() => this.changeAutoLockTime(value)}
					right={this.isSelected(value) ? this.renderIcon : null}
					theme={theme}
					disabled={disabled}
				/>
				<Separator theme={theme} />
			</>
		);
	}

	renderAutoLockSwitch = () => {
		const { autoLock } = this.state;
		const { Force_Screen_Lock } = this.props;
		return (
			<Switch
				value={autoLock}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleAutoLock}
				disabled={Force_Screen_Lock}
			/>
		);
	}

	renderBiometrySwitch = () => {
		const { biometry } = this.state;
		return (
			<Switch
				value={biometry}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleBiometry}
			/>
		);
	}

	renderAutoLockItems = () => {
		const { autoLock, autoLockTime } = this.state;
		const { theme, Force_Screen_Lock_After, Force_Screen_Lock } = this.props;
		if (!autoLock) {
			return null;
		}
		let items = this.defaultAutoLockOptions;
		if (Force_Screen_Lock && Force_Screen_Lock_After > 0) {
			items = [{
				title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
				value: Force_Screen_Lock_After,
				disabled: true
			}];
		// if Force_Screen_Lock is disabled and autoLockTime is a value that isn't on our defaultOptions we'll show it
		} else if (Force_Screen_Lock_After === autoLockTime && !items.find(item => item.value === autoLockTime)) {
			items.push({
				title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
				value: Force_Screen_Lock_After
			});
		}
		return (
			<>
				<Separator style={styles.emptySpace} theme={theme} />
				{items.map(item => this.renderItem({ item }))}
			</>
		);
	}

	renderDisclosure = () => {
		const { theme } = this.props;
		return <DisclosureImage theme={theme} />;
	}

	renderBiometry = () => {
		const { autoLock, biometryLabel } = this.state;
		const { theme } = this.props;
		if (!autoLock || !biometryLabel) {
			return null;
		}
		return (
			<>
				<Separator theme={theme} />
				<ListItem
					title={I18n.t('Local_authentication_unlock_with_label', { label: biometryLabel })}
					right={() => this.renderBiometrySwitch()}
					theme={theme}
				/>
				<Separator theme={theme} />
			</>
		);
	}

	render() {
		const { autoLock } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					keyExtractor={item => item.value}
					contentContainerStyle={styles.listPadding}
				>
					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Local_authentication_unlock_option')}
						right={() => this.renderAutoLockSwitch()}
						theme={theme}
					/>
					{autoLock
						? (
							<>
								<Separator theme={theme} />
								<ListItem
									title={I18n.t('Local_authentication_change_passcode')}
									theme={theme}
									right={this.renderDisclosure}
									onPress={this.changePasscode}
								/>
							</>
						)
						: null
					}
					<Separator theme={theme} />
					<ItemInfo
						info={I18n.t('Local_authentication_info')}
						theme={theme}
					/>
					{this.renderBiometry()}
					{this.renderAutoLockItems()}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	Force_Screen_Lock: state.settings.Force_Screen_Lock,
	Force_Screen_Lock_After: state.settings.Force_Screen_Lock_After
});

export default connect(mapStateToProps)(withTheme(ScreenLockConfigView));

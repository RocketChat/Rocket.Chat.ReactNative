import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';

import I18n from '../i18n';
import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes, SWITCH_TRACK_COLOR } from '../constants/colors';
import sharedStyles from './Styles';
import StatusBar from '../containers/StatusBar';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import ItemInfo from '../containers/ItemInfo';
import { CustomIcon } from '../lib/Icons';
import database from '../lib/database';
import { supportedBiometryLabel, changePasscode, checkHasPasscode } from '../utils/localAuthentication';
import { DisclosureImage } from '../containers/DisclosureIndicator';
import { DEFAULT_AUTO_LOCK_OPTIONS, DEFAULT_AUTO_LOCK } from '../constants/localAuthentication';

const styles = StyleSheet.create({
	listPadding: {
		paddingVertical: 36
	},
	emptySpace: {
		marginTop: 36
	}
});

const DEFAULT_BIOMETRY = true;

class ScreenLockConfigView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Screen_lock'),
		...themedHeader(screenProps.theme)
	})

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
			biometry: true,
			biometryLabel: null
		};
		this.init();
	}

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
	}

	save = async() => {
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
		await changePasscode({ force });
	}

	toggleAutoLock = () => {
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
		this.setState(({ biometry }) => ({ biometry: !biometry }), () => this.save());
	}

	isSelected = (value) => {
		const { autoLockTime } = this.state;
		return autoLockTime === value;
	}

	changeAutoLockTime = (autoLockTime) => {
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
		const { autoLock } = this.state;
		const { theme, Force_Screen_Lock_After, Force_Screen_Lock } = this.props;
		if (!autoLock) {
			return null;
		}
		let items = DEFAULT_AUTO_LOCK_OPTIONS;
		if (Force_Screen_Lock && Force_Screen_Lock_After > 0) {
			items = [{
				title: I18n.t('After_seconds_set_by_admin', { seconds: Force_Screen_Lock_After }),
				value: Force_Screen_Lock_After,
				disabled: true
			}];
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
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
			>
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

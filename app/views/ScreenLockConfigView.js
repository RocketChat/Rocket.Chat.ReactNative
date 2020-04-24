import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, View, Switch, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';

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
import { supportedBiometryLabel } from '../utils/localAuthentication';
import { DisclosureImage } from '../containers/DisclosureIndicator';
import { PASSCODE_KEY } from '../constants/localAuthentication';

const styles = StyleSheet.create({
	listPadding: {
		paddingVertical: 36
	}
});

class ScreenLockConfigView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Screen_lock'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		theme: PropTypes.string,
		server: PropTypes.string,
		navigation: PropTypes.object
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
				autoLockTime: this.serverRecord?.autoLockTime || 1800,
				biometry: this.serverRecord.biometry === null ? true : this.serverRecord.biometry
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
				record.autoLockTime = autoLockTime;
				record.biometry = biometry === null ? true : biometry;
			});
		});
	}

	setPasscode = async() => {
		const { autoLock } = this.state;
		const { navigation } = this.props;
		if (autoLock) {
			const storedPasscode = await RNUserDefaults.get(PASSCODE_KEY);
			if (!storedPasscode) {
				navigation.navigate('ChangePasscodeView', { forceSetPasscode: true });
			}
		}
	}

	autoLock = () => {
		this.setState(({ autoLock }) => ({ autoLock: !autoLock }), () => {
			this.save();
			this.setPasscode();
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

	changePasscode = () => {
		const { navigation } = this.props;
		navigation.navigate('ChangePasscodeView');
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
		const { title, value } = item;
		return (
			<>
				<ListItem
					title={title}
					onPress={() => this.changeAutoLockTime(value)}
					right={this.isSelected(value) ? this.renderIcon : null}
					theme={theme}
				/>
				<Separator theme={theme} />
			</>
		);
	}

	renderAutoLockSwitch = () => {
		const { autoLock } = this.state;
		return (
			<Switch
				value={autoLock}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.autoLock}
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
		const { theme } = this.props;
		if (!autoLock) {
			return null;
		}
		return (
			<>
				<View style={{ height: 36 }} />
				<Separator theme={theme} />
				{autoLock ? this.defaultAutoLockOptions.map(item => this.renderItem({ item })) : null}
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
	server: state.server.server
});

export default connect(mapStateToProps)(withTheme(ScreenLockConfigView));

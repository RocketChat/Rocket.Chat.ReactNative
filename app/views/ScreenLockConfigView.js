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

const DEFAULT_AUTO_LOCK = [
	{
		title: 'After 1 minute',
		value: 5
	},
	{
		title: 'After 5 minutes',
		value: 300
	},
	{
		title: 'After 15 minutes',
		value: 900
	},
	{
		title: 'After 30 minutes',
		value: 1800
	},
	{
		title: 'After 1 hour',
		value: 3600
	}
];

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

	constructor(props) {
		super(props);
		this.state = {
			autoLock: false,
			autoLockTime: null,
			supported: [],
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
				biometry: this.serverRecord?.biometry || true
			});
		} catch (error) {
			// TODO: raise error in case server wasn't found and pop?
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
				record.biometry = biometry;
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
		const { autoLock, supported } = this.state;
		const { theme } = this.props;
		if (!autoLock) {
			return null;
		}
		return (
			<>
				<View style={{ height: 36 }} />
				<Separator theme={theme} />
				{autoLock ? DEFAULT_AUTO_LOCK.concat(supported).map(item => this.renderItem({ item })) : null}
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
					title={`Unlock with ${ biometryLabel }`}
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
						title='Unlock with Passcode'
						right={() => this.renderAutoLockSwitch()}
						theme={theme}
					/>
					{autoLock
						? (
							<>
								<Separator theme={theme} />
								<ListItem
									title='Change Passcode'
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
						info={'Note: if you forget the passcode, you\'ll need to delete and reinstall the app.'}
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

import React, { Component } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback, TouchableOpacity, FlatList, Image, Pressable
} from 'react-native';
import PropTypes from 'prop-types';
import { connect, batch } from 'react-redux';
import equal from 'deep-equal';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import { toggleServerDropdown as toggleServerDropdownAction } from '../../actions/rooms';
import { selectServerRequest as selectServerRequestAction, serverInitAdd as serverInitAddAction } from '../../actions/server';
import { appStart as appStartAction, ROOT_NEW_SERVER } from '../../actions/app';
import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import EventEmitter from '../../utils/events';
import Check from '../../containers/Check';
import database from '../../lib/database';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { KEY_COMMAND, handleCommandSelectServer } from '../../commands';
import { isTablet, isIOS } from '../../utils/deviceInfo';
import { localAuthenticate } from '../../utils/localAuthentication';
import { showConfirmationAlert } from '../../utils/info';
import { logEvent, events } from '../../utils/log';
import { headerHeight } from '../../containers/Header';
import { goRoom } from '../../utils/goRoom';
import UserPreferences from '../../lib/userPreferences';

const ROW_HEIGHT = 68;
const ANIMATION_DURATION = 200;

class ServerDropdown extends Component {
	static propTypes = {
		navigation: PropTypes.object,
		insets: PropTypes.object,
		closeServerDropdown: PropTypes.bool,
		server: PropTypes.string,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool,
		appStart: PropTypes.func,
		toggleServerDropdown: PropTypes.func,
		selectServerRequest: PropTypes.func,
		initAdd: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = { servers: [] };
		this.animatedValue = new Animated.Value(0);
	}

	async componentDidMount() {
		const serversDB = database.servers;
		const observable = await serversDB.collections
			.get('servers')
			.query()
			.observeWithColumns(['name']);

		this.subscription = observable.subscribe((data) => {
			this.setState({ servers: data });
		});

		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
		).start();
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { servers } = this.state;
		const { closeServerDropdown, server, theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.closeServerDropdown !== closeServerDropdown) {
			return true;
		}
		if (nextProps.server !== server) {
			return true;
		}
		if (!equal(nextState.servers, servers)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const { closeServerDropdown } = this.props;
		if (prevProps.closeServerDropdown !== closeServerDropdown) {
			this.close();
		}
	}

	componentWillUnmount() {
		if (this.newServerTimeout) {
			clearTimeout(this.newServerTimeout);
			this.newServerTimeout = false;
		}
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
	}

	close = () => {
		const { toggleServerDropdown } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
		).start(() => toggleServerDropdown());
	}

	navToNewServer = (previousServer) => {
		const { appStart, initAdd } = this.props;
		batch(() => {
			appStart({ root: ROOT_NEW_SERVER });
			initAdd(previousServer);
		});
	}

	addServer = () => {
		logEvent(events.RL_ADD_SERVER);
		const { server } = this.props;
		this.close();
		setTimeout(() => {
			this.navToNewServer(server);
		}, ANIMATION_DURATION);
	}

	select = async(server) => {
		const {
			server: currentServer, selectServerRequest, isMasterDetail
		} = this.props;
		this.close();
		if (currentServer !== server) {
			logEvent(events.RL_CHANGE_SERVER);
			const userId = await UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ server }`);
			if (isMasterDetail) {
				goRoom({ item: {}, isMasterDetail });
			}
			if (!userId) {
				setTimeout(() => {
					this.navToNewServer(currentServer);
					this.newServerTimeout = setTimeout(() => {
						EventEmitter.emit('NewServer', { server });
					}, ANIMATION_DURATION);
				}, ANIMATION_DURATION);
			} else {
				await localAuthenticate(server);
				selectServerRequest(server);
			}
		}
	}

	remove = server => showConfirmationAlert({
		message: I18n.t('This_will_remove_all_data_from_this_server'),
		callToAction: I18n.t('Delete'),
		onPress: async() => {
			this.close();
			try {
				await RocketChat.removeServer({ server });
			} catch {
				// do nothing
			}
		}
	});

	handleCommands = ({ event }) => {
		const { servers } = this.state;
		const { navigation } = this.props;
		const { input } = event;
		if (handleCommandSelectServer(event)) {
			if (servers[input - 1]) {
				this.select(servers[input - 1].id);
				navigation.navigate('RoomView');
			}
		}
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.serverSeparator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderServer = ({ item }) => {
		const { server, theme } = this.props;

		return (
			<Pressable
				onPress={() => this.select(item.id)}
				onLongPress={() => (item.id === server || this.remove(item.id))}
				testID={`rooms-list-header-server-${ item.id }`}
				android_ripple={{
					color: themes[theme].bannerBackground
				}}
				style={({ pressed }) => ({
					backgroundColor: isIOS && pressed
						? themes[theme].bannerBackground
						: 'transparent'
				})}
			>
				<View style={styles.serverItemContainer}>
					{item.iconURL
						? (
							<Image
								source={{ uri: item.iconURL }}
								defaultSource={{ uri: 'logo' }}
								style={styles.serverIcon}
								onError={() => console.warn('error loading serverIcon')}
							/>
						)
						: (
							<Image
								source={{ uri: 'logo' }}
								style={styles.serverIcon}
							/>
						)
					}
					<View style={styles.serverTextContainer}>
						<Text style={[styles.serverName, { color: themes[theme].titleText }]} numberOfLines={1}>{item.name || item.id}</Text>
						<Text style={[styles.serverUrl, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>{item.id}</Text>
					</View>
					{item.id === server ? <Check theme={theme} /> : null}
				</View>
			</Pressable>
		);
	}

	render() {
		const { servers } = this.state;
		const { theme, isMasterDetail, insets } = this.props;
		const maxRows = 4;
		const initialTop = 41 + (Math.min(servers.length, maxRows) * ROW_HEIGHT);
		const statusBarHeight = insets?.top ?? 0;
		const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-initialTop, heightDestination]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.6]
		});
		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop,
						{
							backgroundColor: themes[theme].backdropColor,
							opacity: backdropOpacity,
							top: heightDestination
						}]}
					/>
				</TouchableWithoutFeedback>
				<Animated.View
					style={[
						styles.dropdownContainer,
						{
							transform: [{ translateY }],
							backgroundColor: themes[theme].backgroundColor,
							borderColor: themes[theme].separatorColor
						}
					]}
					testID='rooms-list-header-server-dropdown'
				>
					<View
						style={[
							styles.dropdownContainerHeader,
							styles.serverHeader,
							{ borderColor: themes[theme].separatorColor }
						]}
					>
						<Text style={[styles.serverHeaderText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Server')}</Text>
						<TouchableOpacity onPress={this.addServer} testID='rooms-list-header-server-add'>
							<Text style={[styles.serverHeaderAdd, { color: themes[theme].tintColor }]}>{I18n.t('Add_Server')}</Text>
						</TouchableOpacity>
					</View>
					<FlatList
						style={{ maxHeight: maxRows * ROW_HEIGHT }}
						data={servers}
						keyExtractor={item => item.id}
						renderItem={this.renderServer}
						ItemSeparatorComponent={this.renderSeparator}
						keyboardShouldPersistTaps='always'
					/>
				</Animated.View>
			</>
		);
	}
}

const mapStateToProps = state => ({
	closeServerDropdown: state.rooms.closeServerDropdown,
	server: state.server.server,
	isMasterDetail: state.app.isMasterDetail
});

const mapDispatchToProps = dispatch => ({
	toggleServerDropdown: () => dispatch(toggleServerDropdownAction()),
	selectServerRequest: server => dispatch(selectServerRequestAction(server)),
	appStart: params => dispatch(appStartAction(params)),
	initAdd: previousServer => dispatch(serverInitAddAction(previousServer))
});

export default connect(mapStateToProps, mapDispatchToProps)(withSafeAreaInsets(withTheme(ServerDropdown)));

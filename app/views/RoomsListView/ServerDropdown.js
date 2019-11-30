import React, { Component } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback, TouchableOpacity, FlatList, Image
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { withNavigation } from 'react-navigation';
import RNUserDefaults from 'rn-user-defaults';

import { toggleServerDropdown as toggleServerDropdownAction } from '../../actions/rooms';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import { appStart as appStartAction } from '../../actions';
import styles from './styles';
import Touch from '../../utils/touch';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import EventEmitter from '../../utils/events';
import Check from '../../containers/Check';
import database from '../../lib/database';
import { KEY_COMMAND, handleCommandSelectServer } from '../../commands';
import { isTablet } from '../../utils/deviceInfo';
import { withSplit } from '../../split';

const ROW_HEIGHT = 68;
const ANIMATION_DURATION = 200;

class ServerDropdown extends Component {
	static propTypes = {
		navigation: PropTypes.object,
		closeServerDropdown: PropTypes.bool,
		split: PropTypes.bool,
		server: PropTypes.string,
		toggleServerDropdown: PropTypes.func,
		selectServerRequest: PropTypes.func,
		appStart: PropTypes.func
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
		const { closeServerDropdown, server } = this.props;
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

	addServer = () => {
		const { server, navigation } = this.props;

		this.close();
		setTimeout(() => {
			navigation.navigate('OnboardingView', { previousServer: server });
		}, ANIMATION_DURATION);
	}

	select = async(server) => {
		const {
			server: currentServer, selectServerRequest, appStart, navigation, split
		} = this.props;

		this.close();
		if (currentServer !== server) {
			const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
			if (split) {
				navigation.navigate('RoomView');
			}
			if (!userId) {
				appStart();
				this.newServerTimeout = setTimeout(() => {
					EventEmitter.emit('NewServer', { server });
				}, 1000);
			} else {
				selectServerRequest(server);
			}
		}
	}

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

	renderSeparator = () => <View style={styles.serverSeparator} />;

	renderServer = ({ item }) => {
		const { server } = this.props;

		return (
			<Touch onPress={() => this.select(item.id)} style={styles.serverItem} testID={`rooms-list-header-server-${ item.id }`}>
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
						<Text style={styles.serverName}>{item.name || item.id}</Text>
						<Text style={styles.serverUrl}>{item.id}</Text>
					</View>
					{item.id === server ? <Check /> : null}
				</View>
			</Touch>
		);
	}

	render() {
		const { servers } = this.state;
		const maxRows = 4;
		const initialTop = 41 + (Math.min(servers.length, maxRows) * ROW_HEIGHT);
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-initialTop, 0]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.3]
		});
		return (
			[
				<TouchableWithoutFeedback key='sort-backdrop' onPress={this.close}>
					<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>,
				<Animated.View
					key='sort-container'
					style={[styles.dropdownContainer, { transform: [{ translateY }] }]}
					testID='rooms-list-header-server-dropdown'
				>
					<View style={[styles.dropdownContainerHeader, styles.serverHeader]}>
						<Text style={styles.serverHeaderText}>{I18n.t('Server')}</Text>
						<TouchableOpacity onPress={this.addServer} testID='rooms-list-header-server-add'>
							<Text style={styles.serverHeaderAdd}>{I18n.t('Add_Server')}</Text>
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
			]
		);
	}
}

const mapStateToProps = state => ({
	closeServerDropdown: state.rooms.closeServerDropdown,
	server: state.server.server
});

const mapDispatchToProps = dispatch => ({
	toggleServerDropdown: () => dispatch(toggleServerDropdownAction()),
	selectServerRequest: server => dispatch(selectServerRequestAction(server)),
	appStart: () => dispatch(appStartAction('outside'))
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(withSplit(ServerDropdown)));

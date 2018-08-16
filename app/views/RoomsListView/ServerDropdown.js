import React, { Component } from 'react';
import { View, Text, Animated, Easing, TouchableWithoutFeedback, TouchableOpacity, FlatList, Image, AsyncStorage } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import styles from './styles';
import { toggleServerDropdown } from '../../actions/rooms';
import { selectServerRequest } from '../../actions/server';
import { appStart } from '../../actions';
import database from '../../lib/realm';
import Touch from './touch';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';

@connect(state => ({
	closeServerDropdown: state.rooms.closeServerDropdown,
	server: state.server.server
}), dispatch => ({
	toggleServerDropdown: () => dispatch(toggleServerDropdown()),
	selectServerRequest: server => dispatch(selectServerRequest(server)),
	appStart: () => dispatch(appStart('outside'))
}))
export default class ServerDropdown extends Component {
	static propTypes = {
		navigator: PropTypes.object,
		closeServerDropdown: PropTypes.string,
		server: PropTypes.string,
		toggleServerDropdown: PropTypes.func,
		selectServerRequest: PropTypes.func,
		appStart: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			servers: []
		};
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: 300,
				easing: Easing.ease,
				useNativeDriver: true
			},
		).start();
		this.servers = database.databases.serversDB.objects('servers');
		this.servers.addListener(this.updateState);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.closeServerDropdown !== this.props.closeServerDropdown) {
			this.close();
		}
	}

	updateState = () => {
		const { servers } = this;
		this.setState({ servers });
	}

	close = () => {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: 300,
				easing: Easing.ease,
				useNativeDriver: true
			}
		).start(() => this.props.toggleServerDropdown());
	}

	addServer = () => {
		this.close();
		setTimeout(() => {
			this.props.navigator.showModal({
				screen: 'NewServerView',
				title: 'Add_Server',
				passProps: {
					previousServer: this.props.server
				}
			});
		}, 300);
	}

	select = async(server) => {
		this.close();
		if (this.props.server !== server) {
			this.props.selectServerRequest(server);
			const token = await AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
			if (!token) {
				this.props.appStart();
				setTimeout(() => {
					this.props.navigator.push({
						screen: 'NewServerView',
						passProps: {
							server
						},
						navigatorStyle: {
							navBarHidden: true
						}
					});
				}, 1000);
			}
		}
	}

	renderSeparator = () => <View style={styles.serverSeparator} />;

	renderServer = ({ item }) => (
		<Touch onPress={() => this.select(item.id)} style={styles.serverItem}>
			<View style={styles.serverItemContainer}>
				<Image source={{ uri: item.iconURL }} defaultSource={{ uri: 'logo' }} style={styles.serverIcon} />
				<View style={styles.serverTextContainer}>
					<Text style={styles.serverName}>{item.name || item.id}</Text>
					<Text style={styles.serverUrl}>{item.id}</Text>
				</View>
				{item.id === this.props.server ? <Image style={styles.checkIcon} source={{ uri: 'check' }} /> : null}
			</View>
		</Touch>
	)

	render() {
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-400, 0]
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
				>
					<View style={[styles.dropdownContainerHeader, styles.serverHeader]}>
						<Text style={styles.serverHeaderText}>{I18n.t('Server')}</Text>
						<TouchableOpacity onPress={this.addServer}>
							<Text style={styles.serverHeaderAdd}>{I18n.t('Add_Server')}</Text>
						</TouchableOpacity>
					</View>
					<FlatList
						data={this.state.servers}
						keyExtractor={item => item.id}
						renderItem={this.renderServer}
						ItemSeparatorComponent={this.renderSeparator}
					/>
				</Animated.View>
			]
		);
	}
}

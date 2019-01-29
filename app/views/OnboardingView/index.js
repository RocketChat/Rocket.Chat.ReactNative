import React from 'react';
import {
	View, Text, Image, TouchableOpacity, BackHandler
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect, Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import SafeAreaView from 'react-native-safe-area-view';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import { selectServerRequest, serverInitAdd, serverFinishAdd } from '../../actions/server';
import { appStart as appStartAction } from '../../actions';
import I18n from '../../i18n';
import openLink from '../../utils/openLink';
import Button from './Button';
import styles from './styles';
import LoggedView from '../View';
import { isIOS, isNotch } from '../../utils/deviceInfo';
import store from '../../lib/createStore';
import EventEmitter from '../../utils/events';
import { LIGHT_HEADER } from '../../constants/headerOptions';

let NewServerView = null;

@connect(state => ({
	currentServer: state.server.server,
	adding: state.server.adding
}), dispatch => ({
	initAdd: () => dispatch(serverInitAdd()),
	finishAdd: () => dispatch(serverFinishAdd()),
	selectServer: server => dispatch(selectServerRequest(server)),
	appStart: () => dispatch(appStartAction())
}))
/** @extends React.Component */
export default class OnboardingView extends LoggedView {
	static options() {
		return {
			...LIGHT_HEADER,
			topBar: {
				visible: false,
				drawBehind: true
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		previousServer: PropTypes.string,
		adding: PropTypes.bool,
		selectServer: PropTypes.func.isRequired,
		currentServer: PropTypes.string,
		initAdd: PropTypes.func,
		finishAdd: PropTypes.func,
		appStart: PropTypes.func
	}

	constructor(props) {
		super('OnboardingView', props);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
	}

	componentDidMount() {
		const { previousServer, initAdd } = this.props;
		if (previousServer) {
			initAdd();
		}
		EventEmitter.addEventListener('NewServer', this.handleNewServerEvent);
	}

	shouldComponentUpdate() {
		return false;
	}

	componentWillUnmount() {
		const {
			selectServer, previousServer, currentServer, adding, finishAdd
		} = this.props;
		if (adding) {
			if (previousServer !== currentServer) {
				selectServer(previousServer);
			}
			finishAdd();
		}
		EventEmitter.removeListener('NewServer', this.handleNewServerEvent);
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
	}

	handleBackPress = () => {
		const { appStart } = this.props;
		appStart('background');
		return false;
	}

	close = () => {
		const { componentId } = this.props;
		Navigation.dismissModal(componentId);
	}

	newServer = (server) => {
		if (NewServerView == null) {
			NewServerView = require('../NewServerView').default;
			Navigation.registerComponentWithRedux('NewServerView', () => gestureHandlerRootHOC(NewServerView), Provider, store);
		}

		const { componentId } = this.props;
		Navigation.push(componentId, {
			component: {
				id: 'NewServerView',
				name: 'NewServerView',
				passProps: {
					server
				},
				options: {
					topBar: {
						visible: false
					}
				}
			}
		});
	}

	handleNewServerEvent = (event) => {
		const { server } = event;
		this.newServer(server);
	}

	connectServer = () => {
		this.newServer();
	}

	joinCommunity = () => {
		this.newServer('https://open.rocket.chat');
	}

	createWorkspace = () => {
		openLink('https://cloud.rocket.chat/trial');
	}

	renderClose = () => {
		const { previousServer } = this.props;

		if (previousServer) {
			let top = 15;
			if (isIOS) {
				top = isNotch ? 45 : 30;
			}
			return (
				<TouchableOpacity
					style={[styles.closeModal, { top }]}
					onPress={this.close}
					testID='onboarding-close'
				>
					<Icon
						name='close'
						size={30}
						color='#1D74F5'
					/>
				</TouchableOpacity>
			);
		}
		return null;
	}

	render() {
		return (
			<SafeAreaView style={styles.container} testID='onboarding-view' forceInset={{ bottom: 'never' }}>
				<Image style={styles.onboarding} source={{ uri: 'onboarding' }} fadeDuration={0} />
				<Text style={styles.title}>{I18n.t('Welcome_to_RocketChat')}</Text>
				<Text style={styles.subtitle}>{I18n.t('Open_Source_Communication')}</Text>
				<View style={styles.buttonsContainer}>
					<Button
						type='secondary'
						title={I18n.t('Connect_to_a_server')}
						icon={<Image source={{ uri: 'connect_server' }} style={{ width: 30, height: 30 }} fadeDuration={0} />}
						onPress={this.connectServer}
						testID='connect-server-button'
					/>
					<Button
						type='secondary'
						title={I18n.t('Join_the_community')}
						subtitle='open.rocket.chat'
						icon={<Image source={{ uri: 'logo_onboarding' }} style={{ width: 32, height: 27 }} fadeDuration={0} />}
						onPress={this.joinCommunity}
						testID='join-community-button'
					/>
					<Button
						type='primary'
						title={I18n.t('Create_a_new_workspace')}
						icon={<Image source={{ uri: 'plus_onboarding' }} style={{ width: 24, height: 24 }} fadeDuration={0} />}
						onPress={this.createWorkspace}
						testID='create-workspace-button'
					/>
				</View>
				{this.renderClose()}
			</SafeAreaView>
		);
	}
}

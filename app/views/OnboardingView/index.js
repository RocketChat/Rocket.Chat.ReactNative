import React from 'react';
import {
	View, Text, Image, TouchableOpacity, BackHandler
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';

import { selectServerRequest, serverInitAdd, serverFinishAdd } from '../../actions/server';
import { appStart as appStartAction } from '../../actions';
import I18n from '../../i18n';
import openLink from '../../utils/openLink';
import Button from './Button';
import styles from './styles';
import LoggedView from '../View';
import { isIOS, isNotch } from '../../utils/deviceInfo';
import EventEmitter from '../../utils/events';
import { CustomIcon } from '../../lib/Icons';
import StatusBar from '../../containers/StatusBar';
import { COLOR_PRIMARY, COLOR_WHITE } from '../../constants/colors';

@connect(state => ({
	currentServer: state.server.server,
	adding: state.server.adding
}), dispatch => ({
	initAdd: () => dispatch(serverInitAdd()),
	finishAdd: () => dispatch(serverFinishAdd()),
	selectServer: server => dispatch(selectServerRequest(server)),
	appStart: root => dispatch(appStartAction(root))
}))
/** @extends React.Component */
export default class OnboardingView extends LoggedView {
	static navigationOptions = () => ({
		header: null
	})

	static propTypes = {
		navigation: PropTypes.object,
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
		this.previousServer = props.navigation.getParam('previousServer');
		Orientation.lockToPortrait();
	}

	componentDidMount() {
		const { initAdd } = this.props;
		if (this.previousServer) {
			initAdd();
		}
		EventEmitter.addEventListener('NewServer', this.handleNewServerEvent);
	}

	shouldComponentUpdate() {
		return false;
	}

	componentWillUnmount() {
		const {
			selectServer, currentServer, adding, finishAdd
		} = this.props;
		if (adding) {
			if (this.previousServer !== currentServer) {
				selectServer(this.previousServer);
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
		const { appStart } = this.props;
		appStart('inside');
	}

	newServer = (server) => {
		const { navigation } = this.props;
		navigation.navigate('NewServerView', { server });
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
		if (this.previousServer) {
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
					<CustomIcon
						name='cross'
						size={30}
						color={COLOR_PRIMARY}
					/>
				</TouchableOpacity>
			);
		}
		return null;
	}

	render() {
		return (
			<SafeAreaView style={styles.container} testID='onboarding-view' forceInset={{ bottom: 'never' }}>
				<StatusBar light />
				<Image style={styles.onboarding} source={{ uri: 'onboarding' }} fadeDuration={0} />
				<Text style={styles.title}>{I18n.t('Welcome_to_RocketChat')}</Text>
				<Text style={styles.subtitle}>{I18n.t('Open_Source_Communication')}</Text>
				<View style={styles.buttonsContainer}>
					<Button
						type='secondary'
						title={I18n.t('Connect_to_a_server')}
						icon={<CustomIcon name='permalink' size={30} color={COLOR_PRIMARY} />}
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
						icon={<CustomIcon name='plus' size={30} color={COLOR_WHITE} />}
						onPress={this.createWorkspace}
						testID='create-workspace-button'
					/>
				</View>
				{this.renderClose()}
			</SafeAreaView>
		);
	}
}

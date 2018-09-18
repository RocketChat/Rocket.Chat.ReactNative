import React from 'react';
import { View, Text, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import { BorderlessButton } from 'react-native-gesture-handler';

import { selectServerRequest, serverInitAdd, serverFinishAdd } from '../../actions/server';
import I18n from '../../i18n';
import openLink from '../../utils/openLink';
import Button from './Button';
import styles from './styles';
import LoggedView from '../View';
import DeviceInfo from '../../utils/deviceInfo';

@connect(state => ({
	currentServer: state.server.server,
	adding: state.server.adding
}), dispatch => ({
	initAdd: () => dispatch(serverInitAdd()),
	finishAdd: () => dispatch(serverFinishAdd()),
	selectServer: server => dispatch(selectServerRequest(server))
}))
/** @extends React.Component */
export default class OnboardingView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		previousServer: PropTypes.string,
		adding: PropTypes.bool,
		selectServer: PropTypes.func.isRequired,
		currentServer: PropTypes.string,
		initAdd: PropTypes.func,
		finishAdd: PropTypes.func
	}

	constructor(props) {
		super('CreateChannelView', props);
	}

	componentDidMount() {
		const { previousServer, initAdd } = this.props;
		if (previousServer) {
			initAdd();
		}
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
	}

	close = () => {
		this.props.navigator.dismissModal();
	}

	connectServer = () => {
		this.props.navigator.push({
			screen: 'NewServerView',
			backButtonTitle: '',
			navigatorStyle: {
				navBarHidden: true
			}
		});
	}

	joinCommunity = () => {
		this.props.navigator.push({
			screen: 'NewServerView',
			backButtonTitle: '',
			passProps: {
				server: 'https://open.rocket.chat'
			},
			navigatorStyle: {
				navBarHidden: true
			}
		});
	}

	createWorkspace = () => {
		openLink('https://cloud.rocket.chat/trial');
	}

	renderClose = () => {
		if (this.props.previousServer) {
			let top = 15;
			if (DeviceInfo.getBrand() === 'Apple') {
				top = DeviceInfo.isNotch() ? 45 : 30;
			}
			return (
				<TouchableOpacity
					style={[styles.closeModal, { top }]}
					onPress={this.close}
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
			<SafeAreaView style={styles.container} testID='onboarding-view'>
				<Image style={styles.onboarding} source={require('../../static/images/onboarding.png')} />
				<Text style={styles.title}>{I18n.t('Welcome_to_RocketChat')}</Text>
				<Text style={styles.subtitle}>{I18n.t('Open_Source_Communication')}</Text>
				<View style={styles.buttonsContainer}>
					<Button
						type='secondary'
						title={I18n.t('Connect_to_a_server')}
						icon={<Image source={require('../../static/images/connectServer.png')} />}
						onPress={this.connectServer}
						testID='connect-server-button'
					/>
					<Button
						type='secondary'
						title={I18n.t('Join_the_community')}
						subtitle='open.rocket.chat'
						icon={<Image source={require('../../static/images/logoSmall.png')} />}
						onPress={this.joinCommunity}
						testID='join-community-button'
					/>
					<Button
						type='primary'
						title={I18n.t('Create_a_new_workspace')}
						icon={<Image source={require('../../static/images/plusWhite.png')} />}
						onPress={this.createWorkspace}
						testID='create-workspace-button'
					/>
				</View>
				{this.renderClose()}
			</SafeAreaView>
		);
	}
}

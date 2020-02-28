import React from 'react';
import {
	View, Text, Image, TouchableOpacity, BackHandler, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';

import { selectServerRequest, serverInitAdd, serverFinishAdd } from '../../actions/server';
import { appStart as appStartAction } from '../../actions';
import I18n from '../../i18n';
import Button from './Button';
import styles from './styles';
import { isIOS, isNotch, isTablet } from '../../utils/deviceInfo';
import EventEmitter from '../../utils/events';
import { CustomIcon } from '../../lib/Icons';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import sharedStyles from '../Styles';

class OnboardingView extends React.Component {
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
		appStart: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		this.previousServer = props.navigation.getParam('previousServer');
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	}

	componentDidMount() {
		const { initAdd } = this.props;
		if (this.previousServer) {
			initAdd();
		}
		EventEmitter.addEventListener('NewServer', this.handleNewServerEvent);
	}

	shouldComponentUpdate(nextProps) {
		const { theme } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
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

	createWorkspace = async() => {
		try {
			await Linking.openURL('https://cloud.rocket.chat/trial');
		} catch {
			// do nothing
		}
	}

	renderClose = () => {
		const { theme } = this.props;
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
						color={themes[theme].actionTintColor}
					/>
				</TouchableOpacity>
			);
		}
		return null;
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: themes[theme].backgroundColor }
				]}
				testID='onboarding-view'
			>
				<StatusBar theme={theme} />
				<Image style={styles.onboarding} source={{ uri: 'onboarding' }} fadeDuration={0} />
				<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Welcome_to_RocketChat')}</Text>
				<Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]}>{I18n.t('Open_Source_Communication')}</Text>
				<View style={[styles.buttonsContainer, isTablet && sharedStyles.tabletScreenContent]}>
					<Button
						type='secondary'
						title={I18n.t('Connect_to_a_server')}
						icon={<CustomIcon name='permalink' size={30} color={themes[theme].actionTintColor} />}
						onPress={this.connectServer}
						testID='connect-server-button'
						theme={theme}
					/>
					<Button
						type='secondary'
						title={I18n.t('Join_the_community')}
						subtitle='open.rocket.chat'
						icon={<Image source={{ uri: 'logo_onboarding' }} style={{ width: 32, height: 27 }} fadeDuration={0} />}
						onPress={this.joinCommunity}
						testID='join-community-button'
						theme={theme}
					/>
					<Button
						type='primary'
						title={I18n.t('Create_a_new_workspace')}
						icon={<CustomIcon name='plus' size={30} color={themes[theme].buttonText} />}
						onPress={this.createWorkspace}
						testID='create-workspace-button'
						theme={theme}
					/>
				</View>
				{this.renderClose()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	currentServer: state.server.server,
	adding: state.server.adding
});

const mapDispatchToProps = dispatch => ({
	initAdd: () => dispatch(serverInitAdd()),
	finishAdd: () => dispatch(serverFinishAdd()),
	selectServer: server => dispatch(selectServerRequest(server)),
	appStart: root => dispatch(appStartAction(root))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(OnboardingView));

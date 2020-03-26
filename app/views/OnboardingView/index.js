import React from 'react';
import {
	View, Text, Image, TouchableOpacity, BackHandler, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Orientation from 'react-native-orientation-locker';

import { selectServerRequest, serverInitAdd, serverFinishAdd } from '../../actions/server';
import { appStart as appStartAction } from '../../actions';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import styles from './styles';
import { isIOS, isNotch, isTablet } from '../../utils/deviceInfo';
import EventEmitter from '../../utils/events';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import sharedStyles from '../Styles';
import FormContainer from '../../containers/FormContainer';

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
			<FormContainer theme={theme}>
				<View style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>
					<Image style={styles.onboarding} source={{ uri: 'logo' }} fadeDuration={0} />
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Onboarding_title')}</Text>
					<Text style={[styles.subtitle, { color: themes[theme].controlText }]}>{I18n.t('Onboarding_subtitle')}</Text>
					<Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{I18n.t('Onboarding_description')}</Text>
					<View style={[styles.buttonsContainer]}>
						<Button
							title={I18n.t('Onboarding_join_workspace')}
							type='primary'
							onPress={this.connectServer}
							theme={theme}
						/>
						<Button
							title={I18n.t('Create_a_new_workspace')}
							type='secondary'
							backgroundColor={themes[theme].chatComponentBackground}
							onPress={this.createWorkspace}
							theme={theme}
						/>
					</View>
				</View>
				{this.renderClose()}
			</FormContainer>
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

import React from 'react';
import {
	View, Text, Image, BackHandler, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Orientation from 'react-native-orientation-locker';

import { appStart as appStartAction, ROOT_BACKGROUND } from '../../actions/app';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import styles from './styles';
import { isTablet } from '../../utils/deviceInfo';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import { logEvent, events } from '../../utils/log';

class OnboardingView extends React.Component {
	static navigationOptions = {
		headerShown: false
	};

	static propTypes = {
		navigation: PropTypes.object,
		appStart: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	}

	componentDidMount() {
		const { navigation } = this.props;
		this.unsubscribeFocus = navigation.addListener('focus', () => {
			this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			if (this.backHandler && this.backHandler.remove) {
				this.backHandler.remove();
			}
		});
	}

	shouldComponentUpdate(nextProps) {
		const { theme } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
	}

	handleBackPress = () => {
		const { appStart } = this.props;
		appStart({ root: ROOT_BACKGROUND });
		return false;
	}

	connectServer = () => {
		logEvent(events.ONBOARD_JOIN_A_WORKSPACE);
		const { navigation } = this.props;
		navigation.navigate('NewServerView');
	}

	createWorkspace = async() => {
		logEvent(events.ONBOARD_CREATE_NEW_WORKSPACE);
		try {
			await Linking.openURL('https://cloud.rocket.chat/trial');
		} catch {
			logEvent(events.ONBOARD_CREATE_NEW_WORKSPACE_F);
		}
	}

	render() {
		const { theme } = this.props;
		return (
			<FormContainer theme={theme} testID='onboarding-view'>
				<FormContainerInner>
					<Image style={styles.onboarding} source={{ uri: 'logo' }} fadeDuration={0} />
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Onboarding_title')}</Text>
					<Text style={[styles.subtitle, { color: themes[theme].controlText }]}>{I18n.t('Onboarding_subtitle')}</Text>
					<Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{I18n.t('Onboarding_description')}</Text>
					<View style={styles.buttonsContainer}>
						<Button
							title={I18n.t('Onboarding_join_workspace')}
							type='primary'
							onPress={this.connectServer}
							theme={theme}
							testID='join-workspace'
						/>
						<Button
							title={I18n.t('Create_a_new_workspace')}
							type='secondary'
							backgroundColor={themes[theme].chatComponentBackground}
							onPress={this.createWorkspace}
							theme={theme}
							testID='create-workspace-button'
						/>
					</View>
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapDispatchToProps = dispatch => ({
	appStart: params => dispatch(appStartAction(params))
});

export default connect(null, mapDispatchToProps)(withTheme(OnboardingView));

import React from 'react';
import {
	View, Text, Image, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import Orientation from 'react-native-orientation-locker';

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
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	}

	shouldComponentUpdate(nextProps) {
		const { theme } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
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
					<Image style={styles.onboarding} source={require('../../static/images/logo.png')} fadeDuration={0} />
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

export default withTheme(OnboardingView);

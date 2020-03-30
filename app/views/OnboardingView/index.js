import React from 'react';
import {
	View, Text, Image, BackHandler, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Orientation from 'react-native-orientation-locker';

import { appStart as appStartAction } from '../../actions';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import styles from './styles';
import { isTablet } from '../../utils/deviceInfo';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';

class OnboardingView extends React.Component {
	static navigationOptions = () => ({
		header: null
	})

	static propTypes = {
		navigation: PropTypes.object,
		appStart: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
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

	componentWillUnmount() {
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
	}

	handleBackPress = () => {
		const { appStart } = this.props;
		appStart('background');
		return false;
	}

	connectServer = () => {
		const { navigation } = this.props;
		navigation.navigate('NewServerView');
	}

	createWorkspace = async() => {
		try {
			await Linking.openURL('https://cloud.rocket.chat/trial');
		} catch {
			// do nothing
		}
	}

	render() {
		const { theme } = this.props;
		return (
			<FormContainer theme={theme}>
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
						/>
						<Button
							title={I18n.t('Create_a_new_workspace')}
							type='secondary'
							backgroundColor={themes[theme].chatComponentBackground}
							onPress={this.createWorkspace}
							theme={theme}
						/>
					</View>
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapDispatchToProps = dispatch => ({
	appStart: root => dispatch(appStartAction(root))
});

export default connect(null, mapDispatchToProps)(withTheme(OnboardingView));

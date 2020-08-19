import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';
import { ScrollView, Text, Clipboard } from 'react-native';

import { encryptionSetBanner as encryptionSetBannerAction } from '../actions/encryption';
import { E2E_RANDOM_PASSWORD_KEY } from '../lib/encryption/constants';
import { CloseModalButton } from '../containers/HeaderButton';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { LISTENER } from '../containers/Toast';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';
import Button from '../containers/Button';
import { withTheme } from '../theme';
import I18n from '../i18n';

class E2ESavePasswordView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseModalButton navigation={navigation} testID='e2e-save-password-view-close' />,
		title: I18n.t('Save_Your_E2E_Password')
	})

	static propTypes = {
		server: PropTypes.string,
		navigation: PropTypes.object,
		encryptionSetBanner: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.state = { password: '' };
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	init = async() => {
		const { server } = this.props;
		try {
			const password = await RNUserDefaults.get(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`);
			if (this.mounted) {
				this.setState({ password });
			} else {
				this.state.password = password;
			}
		} catch {
			// Do nothing
		}
	}

	onSaved = async() => {
		const { navigation, server, encryptionSetBanner } = this.props;
		await RNUserDefaults.clear(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`);
		// Hide encryption banner
		encryptionSetBanner();
		navigation.pop();
	}

	onCopy = () => {
		const { password } = this.state;
		Clipboard.setString(password);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	}

	onHowItWorks = () => {
		const { navigation } = this.props;
		navigation.navigate('E2EHowItWorksView');
	}

	render() {
		const { password } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID='e2e-save-password-view'
				theme={theme}
			>
				<StatusBar theme={theme} />
				<ScrollView
					contentContainerStyle={[
						{
							backgroundColor: themes[theme].backgroundColor,
							borderColor: themes[theme].separatorColor
						}
					]}
					{...scrollPersistTaps}
				>
					<Text>{I18n.t('Your_password_is')}</Text>
					<Text style={{ fontSize: 24, padding: 50, color: '#000' }}>{password || '000-000-000'}</Text>
					<Button
						onPress={this.onCopy}
						style={{ backgroundColor: themes[theme].auxiliaryBackground, width: 100 }}
						title={I18n.t('Copy')}
						type='secondary'
						theme={theme}
					/>
					<Button
						onPress={this.onHowItWorks}
						style={{ backgroundColor: themes[theme].auxiliaryBackground }}
						title={I18n.t('How_It_Works')}
						type='secondary'
						theme={theme}
					/>
					<Button
						onPress={this.onSaved}
						title={I18n.t('I_Saved_My_E2E_Password')}
						theme={theme}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server
});
const mapDispatchToProps = dispatch => ({
	encryptionSetBanner: () => dispatch(encryptionSetBannerAction())
});
export default connect(mapStateToProps, mapDispatchToProps)(withTheme(E2ESavePasswordView));

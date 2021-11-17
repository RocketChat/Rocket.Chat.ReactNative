import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Clipboard, ScrollView, StyleSheet, Text, View } from 'react-native';

import { encryptionSetBanner as encryptionSetBannerAction } from '../actions/encryption';
import { E2E_RANDOM_PASSWORD_KEY } from '../lib/encryption/constants';
import * as HeaderButton from '../containers/HeaderButton';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/userPreferences';
import { events, logEvent } from '../utils/log';
import StatusBar from '../containers/StatusBar';
import { LISTENER } from '../containers/Toast';
import { themes } from '../constants/colors';
import EventEmitter from '../utils/events';
import Button from '../containers/Button';
import { withTheme } from '../theme';
import I18n from '../i18n';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 44,
		paddingTop: 32
	},
	content: {
		marginVertical: 68,
		alignItems: 'center'
	},
	warning: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	passwordText: {
		marginBottom: 8,
		...sharedStyles.textAlignCenter
	},
	password: {
		fontSize: 24,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	copyButton: {
		width: 72,
		height: 32
	},
	info: {
		fontSize: 14,
		marginBottom: 64,
		...sharedStyles.textRegular
	}
});

interface IE2ESaveYourPasswordViewState {
	password: string;
}

interface IE2ESaveYourPasswordViewProps {
	server: string;
	navigation: StackNavigationProp<any, 'E2ESaveYourPasswordView'>;
	encryptionSetBanner(): void;
	theme: string;
}

class E2ESaveYourPasswordView extends React.Component<IE2ESaveYourPasswordViewProps, IE2ESaveYourPasswordViewState> {
	private mounted: boolean;

	static navigationOptions = ({ navigation }: Pick<IE2ESaveYourPasswordViewProps, 'navigation'>) => ({
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='e2e-save-your-password-view-close' />,
		title: I18n.t('Save_Your_E2E_Password')
	});

	constructor(props: IE2ESaveYourPasswordViewProps) {
		super(props);
		this.mounted = false;
		this.state = { password: '' };
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	init = async () => {
		const { server } = this.props;
		try {
			// Set stored password on local state
			const password = await UserPreferences.getStringAsync(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
			if (this.mounted) {
				this.setState({ password: password! });
			} else {
				// @ts-ignore
				this.state.password = password;
			}
		} catch {
			// Do nothing
		}
	};

	onSaved = async () => {
		logEvent(events.E2E_SAVE_PW_SAVED);
		const { navigation, server, encryptionSetBanner } = this.props;
		// Remove stored password
		await UserPreferences.removeItem(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
		// Hide encryption banner
		encryptionSetBanner();
		navigation.pop();
	};

	onCopy = () => {
		logEvent(events.E2E_SAVE_PW_COPY);
		const { password } = this.state;
		Clipboard.setString(password);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	onHowItWorks = () => {
		logEvent(events.E2E_SAVE_PW_HOW_IT_WORKS);
		const { navigation } = this.props;
		navigation.navigate('E2EHowItWorksView');
	};

	render() {
		const { password } = this.state;
		const { theme } = this.props;

		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='e2e-save-password-view'>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					style={sharedStyles.container}
					contentContainerStyle={sharedStyles.containerScrollView}>
					<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
						<Text style={[styles.warning, { color: themes[theme].dangerColor }]}>
							{I18n.t('Save_Your_Encryption_Password_warning')}
						</Text>
						<View style={styles.content}>
							<Text style={[styles.passwordText, { color: themes[theme].bodyText }]}>{I18n.t('Your_password_is')}</Text>
							<Text style={[styles.password, { color: themes[theme].bodyText }]}>{password}</Text>
							<Button
								onPress={this.onCopy}
								style={[styles.copyButton, { backgroundColor: themes[theme].auxiliaryBackground }]}
								title={I18n.t('Copy')}
								type='secondary'
								fontSize={12}
								theme={theme}
							/>
						</View>
						<Text style={[styles.info, { color: themes[theme].bodyText }]}>{I18n.t('Save_Your_Encryption_Password_info')}</Text>
						<Button
							onPress={this.onHowItWorks}
							style={{ backgroundColor: themes[theme].auxiliaryBackground }}
							title={I18n.t('How_It_Works')}
							type='secondary'
							theme={theme}
							testID='e2e-save-password-view-how-it-works'
						/>
						<Button
							onPress={this.onSaved}
							title={I18n.t('I_Saved_My_E2E_Password')}
							theme={theme}
							testID='e2e-save-password-view-saved-password'
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	server: state.server.server
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
	encryptionSetBanner: () => dispatch(encryptionSetBannerAction())
});
export default connect(mapStateToProps, mapDispatchToProps)(withTheme(E2ESaveYourPasswordView));

import React from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import LoggedView from '../View';
import RocketChat from '../../lib/rocketchat';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import RCTextInput from '../../containers/TextInput';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import Loading from '../../containers/Loading';
import { showErrorAlert, Toast } from '../../utils/info';
import log from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';

@connect(state => ({
	userLanguage: state.login.user && state.login.user.language
}), dispatch => ({
	setUser: params => dispatch(setUserAction(params))
}))
/** @extends React.Component */
export default class SettingsView extends LoggedView {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Settings')
	})

	static propTypes = {
		componentId: PropTypes.string,
		userLanguage: PropTypes.string,
		setUser: PropTypes.func
	}

	constructor(props) {
		super('SettingsView', props);
		this.state = {
			placeholder: {},
			language: props.userLanguage ? props.userLanguage : 'en',
			languages: [{
				label: 'English',
				value: 'en'
			}, {
				label: 'Português (BR)',
				value: 'pt-BR'
			}, {
				label: 'Russian',
				value: 'ru'
			}, {
				label: '简体中文',
				value: 'zh-CN'
			}, {
				label: 'Français',
				value: 'fr'
			}, {
				label: 'Deutsch',
				value: 'de'
			}, {
				label: 'Português (PT)',
				value: 'pt-PT'
			}],
			saving: false
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { language, saving } = this.state;
		const { userLanguage } = this.props;
		if (nextState.language !== language) {
			return true;
		}
		if (nextState.saving !== saving) {
			return true;
		}
		if (nextProps.userLanguage !== userLanguage) {
			return true;
		}
		return false;
	}

	getLabel = (language) => {
		const { languages } = this.state;
		const l = languages.find(i => i.value === language);
		if (l && l.label) {
			return l.label;
		}
		return null;
	}

	formIsChanged = () => {
		const { userLanguage } = this.props;
		const { language } = this.state;
		return !(userLanguage === language);
	}

	submit = async() => {
		this.setState({ saving: true });

		const { language } = this.state;
		const { userLanguage, setUser } = this.props;

		if (!this.formIsChanged()) {
			return;
		}

		const params = {};

		// language
		if (userLanguage !== language) {
			params.language = language;
		}

		try {
			await RocketChat.saveUserPreferences(params);
			setUser({ language: params.language });

			this.setState({ saving: false });
			setTimeout(() => {
				this.toast.show(I18n.t('Preferences_saved'));
			}, 300);
		} catch (e) {
			this.setState({ saving: false });
			setTimeout(() => {
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
				log('saveUserPreferences', e);
			}, 300);
		}
	}

	render() {
		const {
			language, languages, placeholder, saving
		} = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='settings-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView style={sharedStyles.container} testID='settings-view' forceInset={{ bottom: 'never' }}>
						<RNPickerSelect
							items={languages}
							onValueChange={(value) => {
								this.setState({ language: value });
							}}
							value={language}
							placeholder={placeholder}
						>
							<RCTextInput
								inputRef={(e) => { this.name = e; }}
								label={I18n.t('Language')}
								placeholder={I18n.t('Language')}
								value={this.getLabel(language)}
								testID='settings-view-language'
							/>
						</RNPickerSelect>
						<View style={sharedStyles.alignItemsFlexStart}>
							<Button
								title={I18n.t('Save_Changes')}
								type='primary'
								onPress={this.submit}
								disabled={!this.formIsChanged()}
								testID='settings-view-button'
							/>
						</View>
						<Loading visible={saving} />
						<Toast ref={toast => this.toast = toast} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

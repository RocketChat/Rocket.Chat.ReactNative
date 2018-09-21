import React from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';

import LoggedView from '../View';
import RocketChat from '../../lib/rocketchat';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import RCTextInput from '../../containers/TextInput';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import Loading from '../../containers/Loading';
import { showErrorAlert, showToast } from '../../utils/info';
import log from '../../utils/log';
import { setUser } from '../../actions/login';

@connect(state => ({
	userLanguage: state.login.user && state.login.user.language
}), dispatch => ({
	setUser: params => dispatch(setUser(params))
}))
/** @extends React.Component */
export default class SettingsView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
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
				label: 'Português',
				value: 'pt-BR'
			}, {
				label: 'Russian',
				value: 'ru'
			}],
			saving: false
		};
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillMount() {
		this.props.navigator.setButtons({
			leftButtons: [{
				id: 'settings',
				icon: { uri: 'settings', scale: Dimensions.get('window').scale }
			}]
		});
	}

	componentDidMount() {
		this.props.navigator.setDrawerEnabled({
			side: 'left',
			enabled: true
		});
	}

	onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'settings') {
				this.props.navigator.toggleDrawer({
					side: 'left'
				});
			}
		}
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
		const { language } = this.state;
		return !(this.props.userLanguage === language);
	}

	submit = async() => {
		this.setState({ saving: true });

		const {
			language
		} = this.state;
		const { userLanguage } = this.props;

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
			this.props.setUser({ language: params.language });

			this.setState({ saving: false });
			setTimeout(() => {
				showToast(I18n.t('Preferences_saved'));

				if (params.language) {
					this.props.navigator.setTitle({ title: I18n.t('Settings') });
				}
			}, 300);
		} catch (e) {
			this.setState({ saving: false });
			setTimeout(() => {
				if (e && e.error) {
					return showErrorAlert(I18n.t(e.error, e.details));
				}
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
				log('saveUserPreferences', e);
			}, 300);
		}
	}

	render() {
		const { language, languages, placeholder } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='settings-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView style={sharedStyles.container} testID='settings-view'>
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
						<Loading visible={this.state.saving} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

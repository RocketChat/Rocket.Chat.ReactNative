import React from 'react';
import PropTypes from 'prop-types';
import {
	View, ScrollView, Switch, Text, StyleSheet, AsyncStorage
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import firebase from 'react-native-firebase';

import RocketChat, { MARKDOWN_KEY } from '../../lib/rocketchat';
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
import { toggleMarkdown as toggleMarkdownAction } from '../../actions/markdown';
import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { isAndroid } from '../../utils/deviceInfo';
import {
	COLOR_WHITE, COLOR_SEPARATOR, COLOR_DANGER, COLOR_SUCCESS
} from '../../constants/colors';

const styles = StyleSheet.create({
	swithContainer: {
		backgroundColor: COLOR_WHITE,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row'
	},
	label: {
		fontSize: 17,
		flex: 1,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	},
	separator: {
		flex: 1,
		height: 1,
		backgroundColor: COLOR_SEPARATOR,
		marginVertical: 10
	}
});

@connect(state => ({
	userLanguage: state.login.user && state.login.user.language,
	useMarkdown: state.markdown.useMarkdown
}), dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	toggleMarkdown: params => dispatch(toggleMarkdownAction(params))
}))
export default class SettingsView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Settings')
	})

	static propTypes = {
		componentId: PropTypes.string,
		userLanguage: PropTypes.string,
		useMarkdown: PropTypes.bool,
		setUser: PropTypes.func,
		toggleMarkdown: PropTypes.func
	}

	constructor(props) {
		super(props);
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
		const { userLanguage, useMarkdown } = this.props;
		if (nextState.language !== language) {
			return true;
		}
		if (nextState.saving !== saving) {
			return true;
		}
		if (nextProps.useMarkdown !== useMarkdown) {
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
				log('err_save_user_preferences', e);
			}, 300);
		}
	}

	toggleMarkdown = (value) => {
		AsyncStorage.setItem(MARKDOWN_KEY, JSON.stringify(value));
		const { toggleMarkdown } = this.props;
		toggleMarkdown(value);
		firebase.analytics().logEvent('toggle_markdown', { value });
	}

	render() {
		const {
			language, languages, placeholder, saving
		} = this.state;
		const { useMarkdown } = this.props;
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
						<View style={styles.separator} />
						<View style={styles.swithContainer}>
							<Text style={styles.label}>{I18n.t('Enable_markdown')}</Text>
							<Switch
								value={useMarkdown}
								onValueChange={this.toggleMarkdown}
								onTintColor={COLOR_SUCCESS}
								tintColor={isAndroid ? COLOR_DANGER : null}
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

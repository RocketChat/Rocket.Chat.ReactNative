import React from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { SafeAreaView, NavigationActions } from 'react-navigation';

import RocketChat from '../../lib/rocketchat';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import Loading from '../../containers/Loading';
import { showErrorAlert, Toast } from '../../utils/info';
import log from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { COLOR_TEXT } from '../../constants/colors';

const LANGUAGES = [{
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
}];

@connect(state => ({
	userLanguage: state.login.user && state.login.user.language
}), dispatch => ({
	setUser: params => dispatch(setUserAction(params))
}))
/** @extends React.Component */
export default class LanguageView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Change_Language')
	})

	static propTypes = {
		componentId: PropTypes.string,
		userLanguage: PropTypes.string,
		navigation: PropTypes.object,
		setUser: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			language: props.userLanguage ? props.userLanguage : 'en',
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

	formIsChanged = (language) => {
		const { userLanguage } = this.props;
		return (userLanguage !== language);
	}

	submit = async(language) => {
		if (!this.formIsChanged(language)) {
			return;
		}

		this.setState({ saving: true });

		const { userLanguage, setUser, navigation } = this.props;

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
				navigation.reset([NavigationActions.navigate({ routeName: 'SettingsView' })], 0);
				navigation.push('RoomsListView');
			}, 300);
		} catch (e) {
			this.setState({ saving: false });
			setTimeout(() => {
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
				log('err_save_user_preferences', e);
			}, 300);
		}
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderItem = ({ value, label }) => {
		const { language } = this.state;
		const isSelected = language === value;
		return (
			<React.Fragment>
				<RectButton
					onPress={() => this.submit(value)}
					activeOpacity={0.1}
					underlayColor={COLOR_TEXT}
				>
					<View style={styles.containerItem}>
						<Text style={styles.text}>{label}</Text>
						{isSelected ? <CustomIcon name='check' size={20} style={styles.checkIcon} /> : null }
					</View>
				</RectButton>
				{this.renderSeparator()}
			</React.Fragment>
		);
	}

	render() {
		const { saving } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={styles.containerScrollView}
					testID='settings-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView style={sharedStyles.container} testID='settings-view' forceInset={{ bottom: 'never' }}>
						{LANGUAGES.map(item => this.renderItem(item))}
						<Loading visible={saving} />
					</SafeAreaView>
				</ScrollView>
				<Toast ref={toast => this.toast = toast} />
			</KeyboardView>
		);
	}
}

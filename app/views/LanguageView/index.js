import React from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import SafeAreaView from 'react-native-safe-area-view';

import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import Loading from '../../containers/Loading';
import { showErrorAlert } from '../../utils/info';
import log from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../Styles';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';

const LANGUAGES = [
	{
		label: '简体中文',
		value: 'zh-CN'
	}, {
		label: 'Deutsch',
		value: 'de'
	}, {
		label: 'English',
		value: 'en'
	}, {
		label: 'Français',
		value: 'fr'
	}, {
		label: 'Português (BR)',
		value: 'pt-BR'
	}, {
		label: 'Português (PT)',
		value: 'pt-PT'
	}, {
		label: 'Russian',
		value: 'ru'
	}
];

class LanguageView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Change_Language')
	})

	static propTypes = {
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
				navigation.reset([NavigationActions.navigate({ routeName: 'SettingsView' })], 0);
				navigation.navigate('RoomsListView');
			}, 300);
		} catch (e) {
			this.setState({ saving: false });
			setTimeout(() => {
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
				log(e);
			}, 300);
		}
	}

	renderSeparator = () => <Separator />

	renderIcon = () => <CustomIcon name='check' size={20} style={sharedStyles.colorPrimary} />

	renderItem = ({ item }) => {
		const { value, label } = item;
		const { language } = this.state;
		const isSelected = language === value;

		return (
			<ListItem
				title={label}
				onPress={() => this.submit(value)}
				testID={`language-view-${ value }`}
				right={isSelected ? this.renderIcon : null}
			/>
		);
	}

	render() {
		const { saving } = this.state;
		return (
			<SafeAreaView style={sharedStyles.listSafeArea} testID='language-view' forceInset={{ vertical: 'never' }}>
				<StatusBar />
				<FlatList
					data={LANGUAGES}
					keyExtractor={item => item.value}
					contentContainerStyle={sharedStyles.listContentContainer}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
				/>
				<Loading visible={saving} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	userLanguage: state.login.user && state.login.user.language
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(LanguageView);

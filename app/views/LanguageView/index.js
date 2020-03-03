import React from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import { showErrorAlert } from '../../utils/info';
import log from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../Styles';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import { appStart as appStartAction } from '../../actions';
import { getUserSelector } from '../../selectors/login';
import database from '../../lib/database';

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
		label: 'Español (ES)',
		value: 'es-ES'
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
	}, {
		label: 'Nederlands',
		value: 'nl'
	}, {
		label: 'Italiano',
		value: 'it'
	}, {
		label: '日本語',
		value: 'ja'
	}
];

class LanguageView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Change_Language'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		user: PropTypes.object,
		setUser: PropTypes.func,
		appStart: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			language: props.user ? props.user.language : 'en'
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { language } = this.state;
		const { user, theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.language !== language) {
			return true;
		}
		if (nextProps.user.language !== user.language) {
			return true;
		}
		return false;
	}

	formIsChanged = (language) => {
		const { user } = this.props;
		return (user.language !== language);
	}

	submit = async(language) => {
		if (!this.formIsChanged(language)) {
			return;
		}

		const { appStart } = this.props;

		await appStart('loading', I18n.t('Change_language_loading'));

		// shows loading for at least 300ms
		await Promise.all([this.changeLanguage(language), new Promise(resolve => setTimeout(resolve, 300))]);

		await appStart('inside');
	}

	changeLanguage = async(language) => {
		const { user, setUser } = this.props;

		const params = {};

		// language
		if (user.language !== language) {
			params.language = language;
		}

		try {
			await RocketChat.saveUserPreferences(params);
			setUser({ language: params.language });

			const serversDB = database.servers;
			const usersCollection = serversDB.collections.get('users');
			await serversDB.action(async() => {
				try {
					const userRecord = await usersCollection.find(user.id);
					await userRecord.update((record) => {
						record.language = params.language;
					});
				} catch (e) {
					// do nothing
				}
			});
		} catch (e) {
			showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
			log(e);
		}
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} style={{ color: themes[theme].tintColor }} />;
	}

	renderItem = ({ item }) => {
		const { value, label } = item;
		const { language } = this.state;
		const { theme } = this.props;
		const isSelected = language === value;

		return (
			<ListItem
				title={label}
				onPress={() => this.submit(value)}
				testID={`language-view-${ value }`}
				right={isSelected ? this.renderIcon : null}
				theme={theme}
			/>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='language-view'
			>
				<StatusBar theme={theme} />
				<FlatList
					data={LANGUAGES}
					keyExtractor={item => item.value}
					contentContainerStyle={[
						sharedStyles.listContentContainer,
						{
							backgroundColor: themes[theme].auxiliaryBackground,
							borderColor: themes[theme].separatorColor
						}
					]}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state)
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	appStart: (...params) => dispatch(appStartAction(...params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LanguageView));

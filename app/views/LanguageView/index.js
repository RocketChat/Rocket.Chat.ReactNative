import React from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';

import RocketChat from '../../lib/rocketchat';
import I18n, { LANGUAGES } from '../../i18n';
import { showErrorAlert } from '../../utils/info';
import log, { logEvent, events } from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { appStart as appStartAction, ROOT_LOADING, ROOT_INSIDE } from '../../actions/app';
import { getUserSelector } from '../../selectors/login';
import database from '../../lib/database';
import SafeAreaView from '../../containers/SafeAreaView';

class LanguageView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Change_Language')
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

		await appStart({ root: ROOT_LOADING, text: I18n.t('Change_language_loading') });

		// shows loading for at least 300ms
		await Promise.all([this.changeLanguage(language), new Promise(resolve => setTimeout(resolve, 300))]);

		await appStart({ root: ROOT_INSIDE });
	}

	changeLanguage = async(language) => {
		logEvent(events.LANG_SET_LANGUAGE);
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
					logEvent(events.LANG_SET_LANGUAGE_F);
				}
			});
		} catch (e) {
			logEvent(events.LANG_SET_LANGUAGE_F);
			showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
			log(e);
		}
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	}

	renderItem = ({ item }) => {
		const { value, label } = item;
		const { language } = this.state;
		const isSelected = language === value;

		return (
			<List.Item
				title={label}
				onPress={() => this.submit(value)}
				testID={`language-view-${ value }`}
				right={isSelected ? this.renderIcon : null}
				translateTitle={false}
			/>
		);
	}

	render() {
		return (
			<SafeAreaView testID='language-view'>
				<StatusBar />
				<FlatList
					data={LANGUAGES}
					keyExtractor={item => item.value}
					ListHeaderComponent={List.Separator}
					ListFooterComponent={List.Separator}
					contentContainerStyle={List.styles.contentContainerStyleFlatList}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
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
	appStart: params => dispatch(appStartAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LanguageView));

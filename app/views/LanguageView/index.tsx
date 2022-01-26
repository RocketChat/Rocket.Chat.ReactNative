import React from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import RNRestart from 'react-native-restart';
import { Dispatch } from 'redux';

import RocketChat from '../../lib/rocketchat';
import I18n, { LANGUAGES, isRTL } from '../../i18n';
import { showErrorAlert } from '../../utils/info';
import log, { events, logEvent } from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { ROOT_INSIDE, ROOT_LOADING, appStart as appStartAction } from '../../actions/app';
import { getUserSelector } from '../../selectors/login';
import database from '../../lib/database';
import SafeAreaView from '../../containers/SafeAreaView';

interface ILanguageViewProps {
	user: {
		id: string;
		language: string;
	};
	setUser(user: object): void;
	appStart(params: any): void;
	theme: string;
}

interface ILanguageViewState {
	language: string;
}

class LanguageView extends React.Component<ILanguageViewProps, ILanguageViewState> {
	static navigationOptions = () => ({
		title: I18n.t('Change_Language')
	});

	constructor(props: ILanguageViewProps) {
		super(props);
		this.state = {
			language: props.user ? props.user.language : 'en'
		};
	}

	shouldComponentUpdate(nextProps: ILanguageViewProps, nextState: ILanguageViewState) {
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

	formIsChanged = (language: string) => {
		const { user } = this.props;
		return user.language !== language;
	};

	submit = async (language: string) => {
		if (!this.formIsChanged(language)) {
			return;
		}

		const { appStart, user } = this.props;

		const shouldRestart = isRTL(language) || isRTL(user.language);

		await appStart({ root: ROOT_LOADING, text: I18n.t('Change_language_loading') });

		// shows loading for at least 300ms
		await Promise.all([this.changeLanguage(language), new Promise(resolve => setTimeout(resolve, 300))]);

		if (shouldRestart) {
			await RNRestart.Restart();
		} else {
			await appStart({ root: ROOT_INSIDE });
		}
	};

	changeLanguage = async (language: string) => {
		logEvent(events.LANG_SET_LANGUAGE);
		const { user, setUser } = this.props;

		const params: { language?: string } = {};

		// language
		if (user.language !== language) {
			params.language = language;
		}

		try {
			await RocketChat.saveUserPreferences(params);
			setUser({ language: params.language });

			const serversDB = database.servers;
			const usersCollection = serversDB.get('users');
			await serversDB.write(async () => {
				try {
					const userRecord = await usersCollection.find(user.id);
					await userRecord.update((record: any) => {
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
	};

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	};

	renderItem = ({ item }: { item: { value: string; label: string } }) => {
		const { value, label } = item;
		const { language } = this.state;
		const isSelected = language === value;

		return (
			<List.Item
				title={label}
				onPress={() => this.submit(value)}
				testID={`language-view-${value}`}
				right={() => (isSelected ? this.renderIcon() : null)}
				translateTitle={false}
			/>
		);
	};

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

const mapStateToProps = (state: any) => ({
	user: getUserSelector(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	setUser: (params: any) => dispatch(setUserAction(params)),
	appStart: (params: any) => dispatch(appStartAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LanguageView));

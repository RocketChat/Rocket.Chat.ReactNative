import React, { useLayoutEffect } from 'react';
import { FlatList } from 'react-native';
import RNRestart from 'react-native-restart';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '../../lib/hooks';
import { appStart } from '../../actions/app';
import { setUser } from '../../actions/login';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { RootEnum } from '../../definitions';
import I18n, { isRTL, LANGUAGES } from '../../i18n';
import database from '../../lib/database';
import { getUserSelector } from '../../selectors/login';
import { SettingsStackParamList } from '../../stacks/types';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import LanguageItem from './LanguageItem';

const LanguageView = () => {
	const { languageDefault, id } = useAppSelector(state => ({
		languageDefault: getUserSelector(state).language,
		id: getUserSelector(state).id
	}));
	const language = languageDefault || 'en';

	const dispatch = useDispatch();
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'LanguageView'>>();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Change_Language')
		});
	}, [navigation]);

	const submit = async (language: string) => {
		if (languageDefault === language) {
			return;
		}

		const shouldRestart = isRTL(language) || isRTL(languageDefault);

		dispatch(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Change_language_loading') }));

		// shows loading for at least 300ms
		await Promise.all([changeLanguage(language), new Promise(resolve => setTimeout(resolve, 300))]);

		if (shouldRestart) {
			await RNRestart.Restart();
		} else {
			dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		}
	};

	const changeLanguage = async (language: string) => {
		logEvent(events.LANG_SET_LANGUAGE);

		const params: { language?: string } = {};

		// language
		if (languageDefault !== language) {
			params.language = language;
		}

		try {
			await Services.saveUserPreferences(params);
			dispatch(setUser({ language: params.language }));

			const serversDB = database.servers;
			const usersCollection = serversDB.get('users');
			await serversDB.write(async () => {
				try {
					const userRecord = await usersCollection.find(id);
					await userRecord.update(record => {
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

	return (
		<SafeAreaView testID='language-view'>
			<StatusBar />
			<FlatList
				data={LANGUAGES}
				keyExtractor={item => item.value}
				ListHeaderComponent={List.Separator}
				ListFooterComponent={List.Separator}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				renderItem={({ item }) => <LanguageItem item={item} language={language} submit={submit} />}
				ItemSeparatorComponent={List.Separator}
			/>
		</SafeAreaView>
	);
};

export default LanguageView;

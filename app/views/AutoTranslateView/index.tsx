import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Switch } from 'react-native';
import { Subscription } from 'rxjs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { ISubscription } from '../../definitions';
import I18n from '../../i18n';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';

const styles = StyleSheet.create({
	list: {
		paddingTop: 16
	}
});

const AutoTranslateView = (): React.ReactElement => {
	const navigation = useNavigation();
	const {
		params: { rid, room }
	} = useRoute<RouteProp<ChatsStackParamList, 'AutoTranslateView'>>();
	const { colors } = useTheme();

	const [languages, setLanguages] = useState<{ language: string; name: string }[]>([]);
	const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(room?.autoTranslateLanguage);
	const [enableAutoTranslate, setEnableAutoTranslate] = useState<boolean | undefined>(room?.autoTranslate);
	const subscription = useRef<Subscription | null>(null);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Auto_Translate')
		});
	}, [navigation]);

	useEffect(() => {
		(async () => {
			try {
				const languages = await Services.getSupportedLanguagesAutoTranslate();
				setLanguages(languages);
			} catch (error) {
				console.log(error);
			}
		})();
	}, []);

	useEffect(() => {
		let letSelectedLanguage = selectedLanguage;
		let letAutoTranslate = enableAutoTranslate;
		subscription.current = room.observe().subscribe((changes: ISubscription) => {
			if (letSelectedLanguage !== changes.autoTranslateLanguage) {
				setSelectedLanguage(changes.autoTranslateLanguage);
				letSelectedLanguage = changes.autoTranslateLanguage;
			}
			if (letAutoTranslate !== changes.autoTranslate) {
				setEnableAutoTranslate(changes.autoTranslate);
				letAutoTranslate = changes.autoTranslate;
			}
		});
		return () => subscription.current?.unsubscribe && subscription.current.unsubscribe();
	}, []);

	const toggleAutoTranslate = async () => {
		logEvent(events.AT_TOGGLE_TRANSLATE);
		try {
			setEnableAutoTranslate(!enableAutoTranslate);
			await Services.saveAutoTranslate({
				rid,
				field: 'autoTranslate',
				value: enableAutoTranslate ? '0' : '1',
				options: { defaultLanguage: 'en' }
			});
		} catch (error) {
			setEnableAutoTranslate(!enableAutoTranslate);
			logEvent(events.AT_TOGGLE_TRANSLATE_F);
		}
	};

	const saveAutoTranslateLanguage = async (selectedLanguage: string) => {
		logEvent(events.AT_SET_LANG);
		try {
			await Services.saveAutoTranslate({
				rid,
				field: 'autoTranslateLanguage',
				value: selectedLanguage
			});
			setSelectedLanguage(selectedLanguage);
		} catch (error) {
			logEvent(events.AT_SET_LANG_F);
		}
	};

	const LanguageItem = React.memo(({ language, name }: { language: string; name?: string }) => (
		<List.Item
			title={name || language}
			onPress={() => saveAutoTranslateLanguage(language)}
			testID={`auto-translate-view-${language}`}
			right={() =>
				selectedLanguage === language ? (
					<List.Icon testID={`auto-translate-view-${language}-check`} name='check' color={colors.badgeBackgroundLevel2} />
				) : null
			}
			translateTitle={false}
			additionalAcessibilityLabel={selectedLanguage === language}
			additionalAcessibilityLabelCheck
		/>
	));

	return (
		<SafeAreaView>
			<StatusBar />
			<FlatList
				testID='auto-translate-view'
				data={languages}
				keyExtractor={item => item.name || item.language}
				renderItem={({ item: { language, name } }) => <LanguageItem language={language} name={name} />}
				ListHeaderComponent={
					<>
						<List.Separator />
						<List.Item
							title='Enable_Auto_Translate'
							right={() => (
								<Switch testID='auto-translate-view-switch' value={enableAutoTranslate} onValueChange={toggleAutoTranslate} />
							)}
							additionalAcessibilityLabel={enableAutoTranslate}
						/>
						<List.Separator />
					</>
				}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={List.Separator}
				contentContainerStyle={[List.styles.contentContainerStyleFlatList, styles.list]}
			/>
		</SafeAreaView>
	);
};

export default AutoTranslateView;

import React, { memo, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import I18n from '../i18n';
import { TSupportedThemes, useTheme } from '../theme';
import { themes } from '../lib/constants';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import { DEFAULT_BROWSER_KEY } from '../lib/methods/helpers/openLink';
import { isIOS } from '../lib/methods/helpers';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/methods/userPreferences';
import { events, logEvent } from '../lib/methods/helpers/log';

type TValue = 'inApp' | 'systemDefault:' | 'googlechrome:' | 'firefox:' | 'brave:';

interface IBrowsersValues {
	title: string;
	value: TValue;
}

const DEFAULT_BROWSERS: IBrowsersValues[] = [
	{
		title: 'In_app',
		value: 'inApp'
	},
	{
		title: isIOS ? 'Safari' : 'Browser',
		value: 'systemDefault:'
	}
];

const BROWSERS: IBrowsersValues[] = [
	{
		title: 'Chrome',
		value: 'googlechrome:'
	},
	{
		title: 'Firefox',
		value: 'firefox:'
	},
	{
		title: 'Brave',
		value: 'brave:'
	}
];

interface IRenderItem extends IBrowsersValues {
	browser: string;
	theme: TSupportedThemes;
	changeDefaultBrowser: (newBrowser: TValue) => void;
}

const RenderItem = memo(({ title, value, browser, changeDefaultBrowser, theme }: IRenderItem) => {
	let isSelected = false;
	if (!browser && value === 'systemDefault:') {
		isSelected = true;
	} else {
		isSelected = browser === value;
	}

	return (
		<List.Item
			title={I18n.t(title, { defaultValue: title })}
			onPress={() => changeDefaultBrowser(value)}
			testID={`default-browser-view-${title}`}
			right={() => (isSelected ? <List.Icon name='check' color={themes[theme].tintColor} /> : null)}
			translateTitle={false}
		/>
	);
});

const DefaultBrowserView = () => {
	const [browser, setBrowser] = useState<string>('');
	const [supported, setSupported] = useState<any[]>([]);

	const { theme } = useTheme();
	const navigation = useNavigation();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Close_Chat')
		});
	}, [navigation]);

	useEffect(() => {
		if (isIOS) {
			BROWSERS.forEach(browser => {
				const { value } = browser;
				Linking.canOpenURL(value).then(installed => {
					if (installed) {
						setSupported(supported => [...supported, browser]);
					}
				});
			});
		}
	}, []);

	const changeDefaultBrowser = useCallback((newBrowser: TValue) => {
		logEvent(events.DB_CHANGE_DEFAULT_BROWSER, { browser: newBrowser });
		try {
			const browser = newBrowser || 'systemDefault:';
			UserPreferences.setString(DEFAULT_BROWSER_KEY, browser);
			setBrowser(browser);
		} catch {
			logEvent(events.DB_CHANGE_DEFAULT_BROWSER_F);
		}
	}, []);

	return (
		<SafeAreaView testID='default-browser-view'>
			<StatusBar />
			<FlatList
				data={DEFAULT_BROWSERS.concat(supported)}
				keyExtractor={item => item.value}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				renderItem={({ item }) => (
					<RenderItem
						browser={browser}
						theme={theme}
						changeDefaultBrowser={changeDefaultBrowser}
						title={item.title}
						value={item.value}
					/>
				)}
				ListHeaderComponent={
					<>
						<List.Header title='Choose_where_you_want_links_be_opened' />
						<List.Separator />
					</>
				}
				ListFooterComponent={List.Separator}
				ItemSeparatorComponent={List.Separator}
			/>
		</SafeAreaView>
	);
};

export default DefaultBrowserView;

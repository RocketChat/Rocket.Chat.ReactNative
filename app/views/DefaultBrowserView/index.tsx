import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { DEFAULT_BROWSER_KEY } from '../../lib/methods/helpers/openLink';
import { isIOS } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import UserPreferences from '../../lib/methods/userPreferences';
import { events, logEvent } from '../../lib/methods/helpers/log';
import Item from './Item';

export type TValue = 'inApp' | 'systemDefault:' | 'googlechrome:' | 'firefox:' | 'brave:';

export interface IBrowsersValues {
	title: string;
	value: TValue;
}

const DEFAULT_BROWSERS: IBrowsersValues[] = [
	{
		title: 'In_app',
		value: 'inApp'
	},
	{
		title: 'System_default',
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

const DefaultBrowserView = () => {
	const [browser, setBrowser] = useState<string | null>(null);
	const [supported, setSupported] = useState<IBrowsersValues[]>([]);

	const navigation = useNavigation();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Default_browser')
		});
	}, [navigation]);

	useEffect(() => {
		const getBrowser = UserPreferences.getString(DEFAULT_BROWSER_KEY);
		setBrowser(getBrowser);

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
					<Item browser={browser} changeDefaultBrowser={changeDefaultBrowser} title={item.title} value={item.value} />
				)}
				ListHeaderComponent={
					<>
						<List.Header title='Choose_where_you_want_links_be_opened' numberOfLines={2} />
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

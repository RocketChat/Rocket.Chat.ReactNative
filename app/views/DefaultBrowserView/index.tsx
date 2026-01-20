import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import I18n from '../../i18n';
import * as List from '../../containers/List';
import { DEFAULT_BROWSER_KEY } from '../../lib/methods/helpers/openLink';
import { isIOS } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import UserPreferences from '../../lib/methods/userPreferences';
import { events, logEvent } from '../../lib/methods/helpers/log';

export type TType = 'In_app' | 'System_default' | 'Chrome' | 'Firefox' | 'Brave'; 
export type TValue = 'inApp' | 'systemDefault:' | 'googlechrome:' | 'firefox:' | 'brave:';

export interface IBrowsersValues {
	title: TType;
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

	const changeDefaultBrowser = useCallback((value: TType) => {
		const newBrowser =
			DEFAULT_BROWSERS.find(x => x.title === value)?.value || BROWSERS.find(x => x.title === value)?.value || 'systemDefault:';

		logEvent(events.DB_CHANGE_DEFAULT_BROWSER, { browser: newBrowser });
		try {
			UserPreferences.setString(DEFAULT_BROWSER_KEY, newBrowser);
			setBrowser(newBrowser);
		} catch {
			logEvent(events.DB_CHANGE_DEFAULT_BROWSER_F);
		}
	}, []);
	return (
		<SafeAreaView testID='default-browser-view'>
			<FlatList
				data={DEFAULT_BROWSERS.concat(supported)}
				keyExtractor={item => item.value}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				renderItem={({ item }) => (
					<List.Radio
						isSelected={(!browser && item.value === 'systemDefault:') || item.value === browser}
						title={item.title}
						value={item.value}
						translateTitle={true}
						translateSubtitle={false}
						onPress={changeDefaultBrowser}
						testID={`default-browser-view-${item.value}`}
					/>
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

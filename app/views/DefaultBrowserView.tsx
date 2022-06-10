import React from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';
import { FlatList, Linking } from 'react-native';

import { SettingsStackParamList } from '../stacks/types';
import { IBaseScreen } from '../definitions';
import I18n from '../i18n';
import { withTheme } from '../theme';
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

interface IDefaultBrowserViewState {
	browser: string | null;
	supported: IBrowsersValues[];
}

type IDefaultBrowserViewProps = IBaseScreen<SettingsStackParamList, 'DefaultBrowserView'>;

class DefaultBrowserView extends React.Component<IDefaultBrowserViewProps, IDefaultBrowserViewState> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Default_browser')
	});

	constructor(props: IDefaultBrowserViewProps) {
		super(props);
		this.state = {
			browser: null,
			supported: []
		};
		if (isIOS) {
			this.init();
		}
	}

	componentDidMount() {
		const browser = UserPreferences.getString(DEFAULT_BROWSER_KEY);
		this.setState({ browser });
	}

	init = () => {
		BROWSERS.forEach(browser => {
			const { value } = browser;
			Linking.canOpenURL(value).then(installed => {
				if (installed) {
					this.setState(({ supported }) => ({ supported: [...supported, browser] }));
				}
			});
		});
	};

	isSelected = (value: TValue) => {
		const { browser } = this.state;
		if (!browser && value === 'systemDefault:') {
			return true;
		}
		return browser === value;
	};

	changeDefaultBrowser = (newBrowser: TValue) => {
		logEvent(events.DB_CHANGE_DEFAULT_BROWSER, { browser: newBrowser });
		try {
			const browser = newBrowser || 'systemDefault:';
			UserPreferences.setString(DEFAULT_BROWSER_KEY, browser);
			this.setState({ browser });
		} catch {
			logEvent(events.DB_CHANGE_DEFAULT_BROWSER_F);
		}
	};

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	};

	renderItem = ({ item }: { item: IBrowsersValues }) => {
		const { title, value } = item;
		return (
			<List.Item
				title={I18n.t(title, { defaultValue: title })}
				onPress={() => this.changeDefaultBrowser(value)}
				testID={`default-browser-view-${title}`}
				right={() => (this.isSelected(value) ? this.renderIcon() : null)}
				translateTitle={false}
			/>
		);
	};

	renderHeader = () => (
		<>
			<List.Header title='Choose_where_you_want_links_be_opened' />
			<List.Separator />
		</>
	);

	render() {
		const { supported } = this.state;
		return (
			<SafeAreaView testID='default-browser-view'>
				<StatusBar />
				<FlatList
					data={DEFAULT_BROWSERS.concat(supported)}
					keyExtractor={item => item.value}
					contentContainerStyle={List.styles.contentContainerStyleFlatList}
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={List.Separator}
					ItemSeparatorComponent={List.Separator}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(DefaultBrowserView);

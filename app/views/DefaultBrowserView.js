import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Linking } from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import { DEFAULT_BROWSER_KEY } from '../utils/openLink';
import { isIOS } from '../utils/deviceInfo';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/userPreferences';
import { logEvent, events } from '../utils/log';

const DEFAULT_BROWSERS = [
	{
		title: 'In_app',
		value: 'inApp'
	},
	{
		title: isIOS ? 'Safari' : 'Browser',
		value: 'systemDefault:'
	}
];

const BROWSERS = [
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

class DefaultBrowserView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Default_browser')
	})

	static propTypes = {
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			browser: null,
			supported: []
		};
		if (isIOS) {
			this.init();
		}
	}

	async componentDidMount() {
		this.mounted = true;
		const browser = await UserPreferences.getStringAsync(DEFAULT_BROWSER_KEY);
		this.setState({ browser });
	}

	init = () => {
		BROWSERS.forEach((browser) => {
			const { value } = browser;
			Linking.canOpenURL(value).then((installed) => {
				if (installed) {
					if (this.mounted) {
						this.setState(({ supported }) => ({ supported: [...supported, browser] }));
					} else {
						const { supported } = this.state;
						this.state.supported = [...supported, browser];
					}
				}
			});
		});
	}

	isSelected = (value) => {
		const { browser } = this.state;
		if (!browser && value === 'inApp') {
			return true;
		}
		return browser === value;
	}

	changeDefaultBrowser = async(newBrowser) => {
		logEvent(events.DB_CHANGE_DEFAULT_BROWSER, { browser: newBrowser });
		try {
			const browser = newBrowser !== 'inApp' ? newBrowser : null;
			await UserPreferences.setStringAsync(DEFAULT_BROWSER_KEY, browser);
			this.setState({ browser });
		} catch {
			logEvent(events.DB_CHANGE_DEFAULT_BROWSER_F);
		}
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	}

	renderItem = ({ item }) => {
		const { title, value } = item;
		return (
			<List.Item
				title={I18n.t(title, { defaultValue: title })}
				onPress={() => this.changeDefaultBrowser(value)}
				testID={`default-browser-view-${ title }`}
				right={this.isSelected(value) ? this.renderIcon : null}
				translateTitle={false}
			/>
		);
	}

	renderHeader = () => (
		<>
			<List.Header title='Choose_where_you_want_links_be_opened' />
			<List.Separator />
		</>
	)

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

import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, FlatList, View, Text, Linking
} from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';
import StatusBar from '../containers/StatusBar';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import { CustomIcon } from '../lib/Icons';
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

const styles = StyleSheet.create({
	list: {
		paddingBottom: 18
	},
	info: {
		paddingTop: 25,
		paddingBottom: 18,
		paddingHorizontal: 16
	},
	infoText: {
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

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

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} color={themes[theme].tintColor} />;
	}

	renderItem = ({ item }) => {
		const { theme } = this.props;
		const { title, value } = item;
		return (
			<ListItem
				title={I18n.t(title, { defaultValue: title })}
				onPress={() => this.changeDefaultBrowser(value)}
				testID={`default-browser-view-${ title }`}
				right={this.isSelected(value) ? this.renderIcon : null}
				theme={theme}
			/>
		);
	}

	renderHeader = () => {
		const { theme } = this.props;
		return (
			<>
				<View style={styles.info}>
					<Text style={[styles.infoText, { color: themes[theme].infoText }]}>{I18n.t('Choose_where_you_want_links_be_opened')}</Text>
				</View>
				{this.renderSeparator()}
			</>
		);
	}

	render() {
		const { supported } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView testID='default-browser-view' theme={theme}>
				<StatusBar theme={theme} />
				<FlatList
					data={DEFAULT_BROWSERS.concat(supported)}
					keyExtractor={item => item.value}
					contentContainerStyle={[
						styles.list,
						{ borderColor: themes[theme].separatorColor }
					]}
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={this.renderSeparator}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(DefaultBrowserView);

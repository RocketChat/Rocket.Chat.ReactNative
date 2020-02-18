import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, FlatList, View, Text, Linking
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import RNUserDefaults from 'rn-user-defaults';

import I18n from '../i18n';
import { themedHeader } from '../utils/navigation';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';
import StatusBar from '../containers/StatusBar';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import { CustomIcon } from '../lib/Icons';

export const DEFAULT_BROWSER_KEY = 'DEFAULT_BROWSER_KEY';
const defaultBrowsers = ['inApp', 'systemDefault'];

const BROWSERS = [
	{
		title: 'inApp',
		value: 'inApp'
	},
	{
		title: 'systemDefault',
		value: 'systemDefault'
	},
	{
		title: 'chrome',
		value: 'googlechrome://'
	},
	{
		title: 'opera',
		value: 'opera-http://'
	},
	{
		title: 'firefox',
		value: 'firefox://'
	},
	{
		title: 'brave',
		value: 'brave://'
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
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Default_browser'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		theme: PropTypes.string
	}

	state = {
		browser: null,
		supported: BROWSERS.filter(browser => defaultBrowsers.includes(browser.value))
	}

	constructor(props) {
		super(props);
		this.init();
	}

	async componentDidMount() {
		this.mounted = true;
		try {
			const browser = await RNUserDefaults.get(DEFAULT_BROWSER_KEY);
			this.setState({ browser });
		} catch {
			// do nothing
		}
	}

	init = () => {
		BROWSERS.filter(browser => !defaultBrowsers.includes(browser.value))
			.forEach((browser) => {
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
		if (!browser && value === 'inApp://') {
			return true;
		}
		return browser === value.replace('://', '');
	}

	changeDefaultBrowser = async(newBrowser) => {
		try {
			const browser = newBrowser.replace('://', '');
			await RNUserDefaults.set(DEFAULT_BROWSER_KEY, browser);
			this.setState({ browser });
		} catch {
			// do nothing
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
				title={title}
				onPress={() => this.changeDefaultBrowser(value !== 'inApp' ? value : null)}
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
					<Text style={[styles.infoText, { color: themes[theme].infoText }]}>choose a browser</Text>
				</View>
				{this.renderSeparator()}
			</>
		);
	}

	render() {
		const { supported } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='theme-view'
			>
				<StatusBar theme={theme} />
				<FlatList
					data={supported}
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

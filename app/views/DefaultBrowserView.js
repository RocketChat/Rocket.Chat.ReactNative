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
import { DEFAULT_BROWSER_KEY } from '../utils/openLink';
import { isIOS } from '../utils/deviceInfo';

const DEFAULT_BROWSERS = [
	{
		title: I18n.t('In_app'),
		value: 'inApp'
	},
	{
		title: isIOS ? 'Safari' : I18n.t('Browser'),
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
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Default_browser'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		theme: PropTypes.string
	}

	state = {
		browser: null,
		supported: []
	}

	constructor(props) {
		super(props);
		if (isIOS) {
			this.init();
		}
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
		try {
			const browser = newBrowser !== 'inApp' ? newBrowser : null;
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
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='default-browser-view'
			>
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

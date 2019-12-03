import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, Text, View, StyleSheet
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
import { THEME_KEY } from '../lib/rocketchat';

const THEMES = [
	{
		label: I18n.t('Automatic'),
		value: 'automatic',
		separator: true,
		header: I18n.t('Theme'),
		group: 'theme'
	}, {
		label: I18n.t('Light'),
		value: 'light',
		group: 'theme'
	}, {
		label: I18n.t('Dark'),
		value: 'dark',
		group: 'theme'
	}, {
		label: I18n.t('Dark'),
		value: 'dark',
		separator: true,
		header: I18n.t('Dark_level'),
		group: 'darkLevel'
	}, {
		label: I18n.t('Black'),
		value: 'black',
		group: 'darkLevel'
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

class ThemeView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Theme'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		theme: PropTypes.string,
		colorScheme: PropTypes.object,
		setTheme: PropTypes.func,
		setDark: PropTypes.func
	}

	isSelected = (item) => {
		const { colorScheme } = this.props;
		const { group } = item;
		const { darkLevel, currentTheme } = colorScheme;
		if (group === 'theme') {
			return item.value === currentTheme;
		}
		if (group === 'darkLevel') {
			return item.value === darkLevel;
		}
	}

	setTheme = async(value) => {
		const { setTheme, colorScheme } = this.props;
		setTheme({ currentTheme: value });
		// no await, because this causes a delay
		await RNUserDefaults.setObjectForKey(THEME_KEY, { ...colorScheme, currentTheme: value });
	};

	setDark = async(value) => {
		const { setDark, colorScheme } = this.props;
		setDark({ darkLevel: value });
		// no await, because this causes a delay
		await RNUserDefaults.setObjectForKey(THEME_KEY, { ...colorScheme, darkLevel: value });
	}

	onClick = (item) => {
		const { value, group } = item;
		if (group === 'theme') {
			this.setTheme(value);
		}
		if (group === 'darkLevel') {
			this.setDark(value);
		}
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} style={{ color: themes[theme].tintColor }} />;
	}

	renderItem = ({ item }) => {
		const { theme } = this.props;
		const { label, value } = item;
		return (
			<>
				{item.separator ? this.renderSectionHeader(item.header) : null}
				<ListItem
					title={label}
					onPress={() => this.onClick(item)}
					testID={`theme-view-${ value }`}
					right={this.isSelected(item) ? this.renderIcon : null}
					theme={theme}
				/>
			</>
		);
	}

	renderSectionHeader = (header) => {
		const { theme } = this.props;
		return (
			<>
				<View style={styles.info}>
					<Text style={[styles.infoText, { color: themes[theme].infoText }]}>{header}</Text>
				</View>
				{this.renderSeparator()}
			</>
		);
	}

	renderFooter = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.info, sharedStyles.separatorTop, { borderColor: themes[theme].separatorColor }]}>
				<Text style={{ color: themes[theme].infoText }}>
					{I18n.t('Applying_a_theme_will_change_how_the_app_looks')}
				</Text>
			</View>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='language-view'
			>
				<StatusBar theme={theme} />
				<FlatList
					data={THEMES}
					keyExtractor={item => item.value}
					contentContainerStyle={[
						styles.list,
						{ borderColor: themes[theme].separatorColor }
					]}
					renderItem={this.renderItem}
					ListHeaderComponent={this.renderHeader}
					ListFooterComponent={this.renderFooter}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(ThemeView);

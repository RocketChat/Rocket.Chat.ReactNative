import React from 'react';
import PropTypes from 'prop-types';
import {
	FlatList, Text, View, StyleSheet
} from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import sharedStyles from './Styles';
import StatusBar from '../containers/StatusBar';
import Separator from '../containers/Separator';
import ListItem from '../containers/ListItem';
import { CustomIcon } from '../lib/Icons';
import { THEME_PREFERENCES_KEY } from '../lib/rocketchat';
import { supportSystemTheme } from '../utils/deviceInfo';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/userPreferences';
import { events, logEvent } from '../utils/log';

const THEME_GROUP = 'THEME_GROUP';
const DARK_GROUP = 'DARK_GROUP';

const SYSTEM_THEME = {
	label: 'Automatic',
	value: 'automatic',
	group: THEME_GROUP
};

const THEMES = [
	{
		label: 'Light',
		value: 'light',
		group: THEME_GROUP
	}, {
		label: 'Dark',
		value: 'dark',
		group: THEME_GROUP
	}, {
		label: 'Dark',
		value: 'dark',
		separator: true,
		header: 'Dark_level',
		group: DARK_GROUP
	}, {
		label: 'Black',
		value: 'black',
		group: DARK_GROUP
	}
];

if (supportSystemTheme()) {
	THEMES.unshift(SYSTEM_THEME);
}

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
	static navigationOptions = () => ({
		title: I18n.t('Theme')
	})

	static propTypes = {
		theme: PropTypes.string,
		themePreferences: PropTypes.object,
		setTheme: PropTypes.func
	}

	isSelected = (item) => {
		const { themePreferences } = this.props;
		const { group } = item;
		const { darkLevel, currentTheme } = themePreferences;
		if (group === THEME_GROUP) {
			return item.value === currentTheme;
		}
		if (group === DARK_GROUP) {
			return item.value === darkLevel;
		}
	}

	onClick = (item) => {
		const { themePreferences } = this.props;
		const { darkLevel, currentTheme } = themePreferences;
		const { value, group } = item;
		let changes = {};
		if (group === THEME_GROUP && currentTheme !== value) {
			logEvent(events.THEME_SET_THEME_GROUP, { theme_group: value });
			changes = { currentTheme: value };
		}
		if (group === DARK_GROUP && darkLevel !== value) {
			logEvent(events.THEME_SET_DARK_LEVEL, { dark_level: value });
			changes = { darkLevel: value };
		}
		this.setTheme(changes);
	}

	setTheme = async(theme) => {
		const { setTheme, themePreferences } = this.props;
		const newTheme = { ...themePreferences, ...theme };
		setTheme(newTheme);
		await UserPreferences.setMapAsync(THEME_PREFERENCES_KEY, newTheme);
	};

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} color={themes[theme].tintColor} />;
	}

	renderItem = ({ item, index }) => {
		const { theme } = this.props;
		const { label, value } = item;
		const isFirst = index === 0;
		return (
			<>
				{item.separator || isFirst ? this.renderSectionHeader(item.header) : null}
				<ListItem
					title={I18n.t(label)}
					onPress={() => this.onClick(item)}
					testID={`theme-view-${ value }`}
					right={this.isSelected(item) ? this.renderIcon : null}
					theme={theme}
				/>
			</>
		);
	}

	renderSectionHeader = (header = 'Theme') => {
		const { theme } = this.props;
		return (
			<>
				<View style={styles.info}>
					<Text style={[styles.infoText, { color: themes[theme].infoText }]}>{I18n.t(header)}</Text>
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
			<SafeAreaView testID='theme-view' theme={theme}>
				<StatusBar theme={theme} />
				<FlatList
					data={THEMES}
					keyExtractor={item => item.value + item.group}
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

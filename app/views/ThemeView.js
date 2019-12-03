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

const THEME_GROUP = 'THEME_GROUP';
const DARK_GROUP = 'DARK_GROUP';

const THEMES = [
	{
		label: I18n.t('Automatic'),
		value: 'automatic',
		separator: true,
		header: I18n.t('Theme'),
		group: THEME_GROUP
	}, {
		label: I18n.t('Light'),
		value: 'light',
		group: THEME_GROUP
	}, {
		label: I18n.t('Dark'),
		value: 'dark',
		group: THEME_GROUP
	}, {
		label: I18n.t('Dark'),
		value: 'dark',
		separator: true,
		header: I18n.t('Dark_level'),
		group: DARK_GROUP
	}, {
		label: I18n.t('Black'),
		value: 'black',
		group: DARK_GROUP
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
		setTheme: PropTypes.func
	}

	isSelected = (item) => {
		const { colorScheme } = this.props;
		const { group } = item;
		const { darkLevel, currentTheme } = colorScheme;
		if (group === THEME_GROUP) {
			return item.value === currentTheme;
		}
		if (group === DARK_GROUP) {
			return item.value === darkLevel;
		}
	}

	onClick = (item) => {
		const { value, group } = item;
		if (group === THEME_GROUP) {
			this.setTheme({ currentTheme: value });
		}
		if (group === DARK_GROUP) {
			this.setTheme({ darkLevel: value });
		}
	}

	setTheme = async(theme) => {
		const { setTheme, colorScheme } = this.props;
		const scheme = { ...colorScheme, ...theme };
		setTheme(scheme);
		await RNUserDefaults.setObjectForKey(THEME_KEY, scheme);
	};

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
				testID='theme-view'
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

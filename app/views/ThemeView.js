import React from 'react';
import PropTypes from 'prop-types';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
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

const themeGroup = THEMES.filter(item => item.group === THEME_GROUP);
const darkGroup = THEMES.filter(item => item.group === DARK_GROUP);

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

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	}

	renderItem = ({ item }) => {
		const { label, value } = item;
		return (
			<>
				<List.Item
					title={label}
					onPress={() => this.onClick(item)}
					testID={`theme-view-${ value }`}
					right={this.isSelected(item) ? this.renderIcon : null}
				/>
				<List.Separator />
			</>
		);
	}

	render() {
		return (
			<SafeAreaView testID='theme-view'>
				<StatusBar />
				<List.Container>
					<List.Section title='Theme'>
						<List.Separator />
						{
							themeGroup.map(item => this.renderItem({ item }))
						}
					</List.Section>
					<List.Section title='Dark_level'>
						<List.Separator />
						{
							darkGroup.map(item => this.renderItem({ item }))
						}
					</List.Section>
				</List.Container>
			</SafeAreaView>
		);
	}
}

export default withTheme(ThemeView);

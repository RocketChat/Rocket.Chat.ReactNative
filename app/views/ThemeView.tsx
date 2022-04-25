import React, { useLayoutEffect } from 'react';

import { SettingsStackParamList } from '../stacks/types';
import I18n from '../i18n';
import { useTheme } from '../theme';
import StatusBar from '../containers/StatusBar';
import * as List from '../containers/List';
import { supportSystemTheme } from '../utils/deviceInfo';
import SafeAreaView from '../containers/SafeAreaView';
import UserPreferences from '../lib/methods/userPreferences';
import { events, logEvent } from '../utils/log';
import { IThemePreference, TThemeMode, TDarkLevel } from '../definitions/ITheme';
import { THEME_PREFERENCES_KEY, themes } from '../lib/constants';
import { IBaseScreen } from '../definitions';

const THEME_GROUP = 'THEME_GROUP';
const DARK_GROUP = 'DARK_GROUP';

const SYSTEM_THEME: ITheme = {
	label: 'Automatic',
	value: 'automatic',
	group: THEME_GROUP
};

const THEMES: ITheme[] = [
	{
		label: 'Light',
		value: 'light',
		group: THEME_GROUP
	},
	{
		label: 'Dark',
		value: 'dark',
		group: THEME_GROUP
	},
	{
		label: 'Black',
		value: 'black',
		group: DARK_GROUP
	},
	{
		label: 'Dark',
		value: 'dark',
		group: DARK_GROUP
	}
];

if (supportSystemTheme()) {
	THEMES.unshift(SYSTEM_THEME);
}

const themeGroup = THEMES.filter(item => item.group === THEME_GROUP);
const darkGroup = THEMES.filter(item => item.group === DARK_GROUP);

interface ITheme {
	label: string;
	value: TThemeMode | TDarkLevel;
	group: string;
}

type IThemeViewProps = IBaseScreen<SettingsStackParamList, 'ThemeView'>;

const ThemeView = ({ navigation }: IThemeViewProps): React.ReactElement => {
	const { theme, themePreferences, setTheme } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Theme')
		});
	}, [navigation]);

	const isSelected = (item: ITheme) => {
		const { group } = item;
		const { darkLevel, currentTheme } = themePreferences as IThemePreference;
		if (group === THEME_GROUP) {
			return item.value === currentTheme;
		}
		if (group === DARK_GROUP) {
			return item.value === darkLevel;
		}
	};

	const onClick = (item: ITheme) => {
		const { darkLevel, currentTheme } = themePreferences as IThemePreference;
		const { value, group } = item;
		let changes: Partial<IThemePreference> = {};
		if (group === THEME_GROUP && currentTheme !== value) {
			logEvent(events.THEME_SET_THEME_GROUP, { theme_group: value });
			changes = { currentTheme: value as TThemeMode };
		}
		if (group === DARK_GROUP && darkLevel !== value) {
			logEvent(events.THEME_SET_DARK_LEVEL, { dark_level: value });
			changes = { darkLevel: value as TDarkLevel };
		}
		_setTheme(changes);
	};

	const _setTheme = (theme: Partial<IThemePreference>) => {
		const newTheme: IThemePreference = { ...(themePreferences as IThemePreference), ...theme };
		if (setTheme) {
			setTheme(newTheme);
			UserPreferences.setMap(THEME_PREFERENCES_KEY, newTheme);
		}
	};

	const renderIcon = () => <List.Icon name='check' color={themes[theme].tintColor} />;

	const renderItem = ({ item }: { item: ITheme }) => {
		const { label, value } = item;
		return (
			<>
				<List.Item
					title={label}
					onPress={() => onClick(item)}
					testID={`theme-view-${value}`}
					right={() => (isSelected(item) ? renderIcon() : null)}
				/>
				<List.Separator />
			</>
		);
	};

	return (
		<SafeAreaView testID='theme-view'>
			<StatusBar />
			<List.Container>
				<List.Section title='Theme'>
					<List.Separator />
					<>{themeGroup.map(item => renderItem({ item }))}</>
				</List.Section>
				<List.Section title='Dark_level'>
					<List.Separator />
					<>{darkGroup.map(item => renderItem({ item }))}</>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default ThemeView;

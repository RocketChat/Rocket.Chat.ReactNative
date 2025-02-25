import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { IThemePreference, TDarkLevel, TThemeMode } from '../definitions/ITheme';
import I18n from '../i18n';
import { THEME_PREFERENCES_KEY } from '../lib/constants';
import { supportSystemTheme } from '../lib/methods/helpers';
import { events, logEvent } from '../lib/methods/helpers/log';
import UserPreferences from '../lib/methods/userPreferences';
import { useTheme } from '../theme';

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

const Item = ({
	onPress,
	label,
	value,
	isSelected
}: {
	onPress: () => void;
	label: string;
	value: string;
	isSelected: boolean;
}) => {
	const { colors } = useTheme();
	return (
		<>
			<List.Item
				title={label}
				onPress={onPress}
				testID={`theme-view-${value}`}
				right={() => (isSelected ? <List.Icon name='check' color={colors.badgeBackgroundLevel2} /> : null)}
				additionalAcessibilityLabel={isSelected}
				additionalAcessibilityLabelCheck
			/>
			<List.Separator />
		</>
	);
};

const ThemeView = (): React.ReactElement => {
	const { themePreferences, setTheme } = useTheme();
	const { setOptions } = useNavigation();

	useLayoutEffect(() => {
		setOptions({
			title: I18n.t('Theme')
		});
	}, []);

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
		handleTheme(changes);
	};

	const handleTheme = (theme: Partial<IThemePreference>) => {
		const newTheme: IThemePreference = { ...(themePreferences as IThemePreference), ...theme };
		if (setTheme) {
			setTheme(newTheme);
			UserPreferences.setMap(THEME_PREFERENCES_KEY, newTheme);
		}
	};

	return (
		<SafeAreaView testID='theme-view'>
			<StatusBar />
			<List.Container>
				<List.Section title='Theme'>
					<List.Separator />
					<>
						{themeGroup.map(theme => (
							<Item
								onPress={() => onClick(theme)}
								label={theme.label}
								value={theme.value}
								isSelected={!!isSelected(theme)}
								key={theme.label}
							/>
						))}
					</>
				</List.Section>
				<List.Section title='Dark_level'>
					<List.Separator />
					<>
						{darkGroup.map(theme => (
							<Item
								onPress={() => onClick(theme)}
								label={theme.label}
								value={theme.value}
								isSelected={!!isSelected(theme)}
								key={theme.label}
							/>
						))}
					</>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default ThemeView;

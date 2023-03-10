export type TThemeMode = 'automatic' | 'light' | 'dark';

export type TDarkLevel = 'black' | 'dark';

export interface IThemePreference {
	currentTheme: TThemeMode;
	darkLevel: TDarkLevel;
}

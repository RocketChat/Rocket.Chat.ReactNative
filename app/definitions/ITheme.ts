export type TThemeMode = 'automatic' | 'light' | 'dark';

export interface IThemePreference {
	currentTheme: TThemeMode;
	darkLevel: string;
}

import { type ReactElement, type ReactNode, useLayoutEffect } from 'react';

import { type IThemePreference } from '../definitions/ITheme';
import { useThemePreferencesStore } from '../lib/theme/themePreferencesStore';
import { type TSupportedThemes } from '../theme';

const THEME_PREFS_MAP: Record<TSupportedThemes, IThemePreference> = {
	light: { currentTheme: 'light', darkLevel: 'black' },
	dark: { currentTheme: 'dark', darkLevel: 'dark' },
	black: { currentTheme: 'dark', darkLevel: 'black' }
};

// When multiple ThemeStory instances mount simultaneously (e.g. a story that renders several
// theme variants side-by-side), effects fire in tree order so each successive instance writes
// over the store.  We capture the pre-story preferences only once (before the first instance
// runs) and restore them only after the last instance unmounts, preventing both cross-variant
// interference and test-to-test state leakage.
let _preStoryPrefs: IThemePreference | null = null;
let _activeCount = 0;

const ThemeStory = ({ theme, children }: { theme: TSupportedThemes; children: ReactNode }): ReactElement => {
	useLayoutEffect(() => {
		if (_activeCount === 0) {
			_preStoryPrefs = useThemePreferencesStore.getState().themePreferences;
		}
		_activeCount += 1;
		useThemePreferencesStore.getState().setTheme(THEME_PREFS_MAP[theme]);

		return () => {
			_activeCount -= 1;
			if (_activeCount === 0 && _preStoryPrefs !== null) {
				useThemePreferencesStore.getState().setTheme(_preStoryPrefs);
				_preStoryPrefs = null;
			}
		};
	}, [theme]);
	return <>{children}</>;
};

export default ThemeStory;

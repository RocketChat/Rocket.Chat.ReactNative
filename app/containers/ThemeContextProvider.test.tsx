import { act, fireEvent, render } from '@testing-library/react-native';
import { useContext, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import ThemeContextProvider from './ThemeContextProvider';
import { ThemeContext, type IThemeContextProps } from '../theme';
import type { IThemePreference } from '../definitions/ITheme';

const defaultPrefs: IThemePreference = { currentTheme: 'light', darkLevel: 'dark' };
const setTheme = jest.fn();

function ContextCapture({ onCapture }: { onCapture: (v: IThemeContextProps) => void }) {
	const value = useContext(ThemeContext);
	onCapture(value);
	return null;
}

// Parent holds its own counter state; ThemeContextProvider receives fixed props.
// This forces ThemeContextProvider to re-render on parent state changes, exercising the
// useMemo dep-check rather than React's same-props bailout shortcut.
function ParentWithCounter({ onCapture }: { onCapture: (v: IThemeContextProps) => void }) {
	const [count, setCount] = useState(0);
	return (
		<>
			<ThemeContextProvider theme='light' themePreferences={defaultPrefs} setTheme={setTheme}>
				<ContextCapture onCapture={onCapture} />
			</ThemeContextProvider>
			<TouchableOpacity testID='bump' onPress={() => setCount(c => c + 1)} accessibilityLabel={String(count)} />
		</>
	);
}

test('value reference is stable across re-renders when theme/prefs unchanged', () => {
	const captured: object[] = [];
	const { getByTestId } = render(<ParentWithCounter onCapture={v => captured.push(v)} />);

	act(() => fireEvent.press(getByTestId('bump')));
	act(() => fireEvent.press(getByTestId('bump')));

	expect(captured.length).toBe(3);
	// All three captures must be the exact same object reference.
	expect(captured[1]).toBe(captured[0]);
	expect(captured[2]).toBe(captured[0]);
});

test('value reference changes when theme prop changes', () => {
	const captured: object[] = [];
	const Wrapper = ({ theme }: { theme: 'light' | 'dark' }) => (
		<ThemeContextProvider theme={theme} themePreferences={defaultPrefs} setTheme={setTheme}>
			<ContextCapture onCapture={v => captured.push(v)} />
		</ThemeContextProvider>
	);

	const { rerender } = render(<Wrapper theme='light' />);
	rerender(<Wrapper theme='dark' />);

	expect(captured.length).toBe(2);
	expect(captured[1]).not.toBe(captured[0]);
	expect(captured[1]).toHaveProperty('theme', 'dark');
});

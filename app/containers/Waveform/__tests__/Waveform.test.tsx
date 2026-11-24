import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';

import Waveform from '..';

jest.mock('~/theme', () => ({
	useTheme: () => ({ colors: { badgeBackgroundLevel1: 'muted', badgeBackgroundLevel2: 'primary' } })
}));

const renderWaveform = (peaks: number[] | null | undefined, width: number) => {
	const { result } = renderHook(() => useSharedValue(0));
	render(<Waveform peaks={peaks} progress={result.current} />);
	const track = screen.getByTestId('waveform');
	fireEvent(track, 'layout', { nativeEvent: { layout: { width } } });
	return screen.getByTestId('waveform').props.children as unknown[];
};

test('draws a flat placeholder while the waveform is missing', () => {
	const bars = renderWaveform(undefined, 300);
	expect(bars).toHaveLength(40);
	expect(bars.every(bar => (bar as { props: { peak: number } }).props.peak === 0)).toBe(true);
});

test('draws fewer, merged bars on a narrow track', () => {
	const peaks = Array.from({ length: 40 }, (_, index) => index / 39);
	const bars = renderWaveform(peaks, 79) as { props: { peak: number } }[];
	expect(bars).toHaveLength(20);
	expect(bars[bars.length - 1].props.peak).toBe(1);
});

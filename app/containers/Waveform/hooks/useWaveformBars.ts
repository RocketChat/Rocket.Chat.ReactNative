import { useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { WAVEFORM_BAR_COUNT } from '~/lib/methods/audioWaveform/computeWaveformPeaks';
import { fitPeaks, layoutBars } from '../layoutBars';

const FLAT_PEAKS: number[] = new Array(WAVEFORM_BAR_COUNT).fill(0);

export const useWaveformBars = (peaks: number[] | null | undefined) => {
	const [width, setWidth] = useState<number>();
	const source = peaks?.length ? peaks : FLAT_PEAKS;
	const { count, gap } = width === undefined ? { count: source.length, gap: 1 } : layoutBars(width, source.length);
	const onLayout = (event: LayoutChangeEvent) => setWidth(Math.floor(event.nativeEvent.layout.width));
	return { bars: fitPeaks(source, count), gap, onLayout };
};

import { useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { WAVEFORM_BAR_COUNT } from '~/lib/methods/audioWaveform/computeWaveformPeaks';
import { countBars, fitPeaks } from '../layoutBars';

const FLAT_PEAKS: number[] = new Array(WAVEFORM_BAR_COUNT).fill(0);

export const useWaveformBars = (peaks: number[] | undefined) => {
	const [width, setWidth] = useState<number>();
	const source = peaks?.length ? peaks : FLAT_PEAKS;
	const count = width ? countBars(width, source.length) : source.length;
	const bars = fitPeaks(source, count).map((peak, index) => ({ peak, position: (index + 0.5) / count }));
	const onLayout = (event: LayoutChangeEvent) => setWidth(Math.floor(event.nativeEvent.layout.width));
	return { bars, onLayout };
};

import { type ReactElement } from 'react';

import I18n from '~/i18n';
import type { TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { CustomIcon } from '~/containers/CustomIcon';
import { VIDEO_QUALITY_ORDER, type VideoQuality } from '~/lib/methods/helpers/captureOptionsFor';
import type { TConferenceLayout } from '~/lib/services/conference/useConferenceInteractionStore';

type TColors = { fontInfo: string; strokeMedium: string };

export const AUDIO_OUTPUT_LABELS: Record<string, string> = {
	speaker: 'Speaker',
	force_speaker: 'Speaker',
	earpiece: 'Audio_output_earpiece',
	headset: 'Audio_output_headset',
	bluetooth: 'Audio_output_bluetooth',
	default: 'Audio_output_default'
};

export const VIDEO_QUALITY_LABELS: Record<VideoQuality, string> = {
	auto: 'Auto',
	h1080: '1080p',
	h720: '720p',
	h360: '360p',
	h180: '180p'
};

const AUDIO_OUTPUT_ICONS: Record<string, TActionSheetOptionsItem['icon']> = {
	speaker: 'volume',
	force_speaker: 'volume',
	earpiece: 'phone',
	headset: 'volume',
	bluetooth: 'signal',
	default: 'volume'
};

const radio = (selected: boolean, colors: TColors) => (): ReactElement => (
	<CustomIcon
		name={selected ? 'radio-checked' : 'radio-unchecked'}
		size={24}
		color={selected ? colors.fontInfo : colors.strokeMedium}
	/>
);

export const buildAudioOutputOptions = (outputs: string[], onSelect: (output: string) => void): TActionSheetOptionsItem[] =>
	outputs.map(output => ({
		title: I18n.t(AUDIO_OUTPUT_LABELS[output] ?? 'Audio_output_default'),
		icon: AUDIO_OUTPUT_ICONS[output] ?? 'volume',
		onPress: () => onSelect(output)
	}));

export const buildVideoQualityOptions = (
	selected: VideoQuality,
	colors: TColors,
	onSelect: (quality: VideoQuality) => void
): TActionSheetOptionsItem[] =>
	VIDEO_QUALITY_ORDER.map(quality => ({
		title: quality === 'auto' ? I18n.t('Auto') : VIDEO_QUALITY_LABELS[quality],
		right: radio(quality === selected, colors),
		onPress: () => onSelect(quality)
	}));

export const CONFERENCE_LAYOUTS: { layout: TConferenceLayout; label: string }[] = [
	{ layout: 'grid', label: 'Layout_grid' },
	{ layout: 'spotlight', label: 'Layout_spotlight' },
	{ layout: 'sidebar', label: 'Layout_sidebar' }
];

export const buildLayoutOptions = (
	selected: TConferenceLayout,
	colors: TColors,
	onSelect: (layout: TConferenceLayout) => void
): TActionSheetOptionsItem[] =>
	CONFERENCE_LAYOUTS.map(({ layout, label }) => ({
		title: I18n.t(label),
		right: radio(layout === selected, colors),
		onPress: () => onSelect(layout)
	}));

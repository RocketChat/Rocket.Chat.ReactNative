import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

const MIN_WAVEFORM_WIDTH = 96;

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		maxWidth: 368,
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 12,
		padding: 8,
		borderWidth: 1,
		borderRadius: 4
	},
	playPauseButton: {
		alignItems: 'center',
		height: 32,
		width: 32,
		borderRadius: 4,
		justifyContent: 'center'
	},
	seek: {
		flexGrow: 1,
		flexBasis: MIN_WAVEFORM_WIDTH,
		height: 32,
		justifyContent: 'center'
	},
	seekTrack: {
		height: '100%',
		justifyContent: 'center'
	},
	timeLabel: {
		flexShrink: 1,
		fontSize: 12,
		lineHeight: 16,
		fontVariant: ['tabular-nums'],
		...sharedStyles.textRegular
	},
	playbackSpeedSlot: {
		minWidth: 64,
		alignItems: 'center'
	},
	containerPlaybackSpeed: {
		minWidth: 48,
		minHeight: 32,
		paddingHorizontal: 8,
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden'
	},
	playbackSpeedText: {
		fontSize: 14,
		...sharedStyles.textBold
	}
});

export default styles;

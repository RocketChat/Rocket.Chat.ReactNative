import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		maxWidth: 368,
		flexDirection: 'row',
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
	seekContainer: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		gap: 12,
		minWidth: 0
	},
	seek: {
		flex: 1,
		height: 32,
		justifyContent: 'center',
		minWidth: 0
	},
	seekTrack: {
		height: '100%',
		justifyContent: 'center'
	},
	timeLabel: {
		flexShrink: 0,
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
		height: 32,
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

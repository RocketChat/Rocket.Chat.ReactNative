import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		borderWidth: 1,
		borderRadius: 4
	},
	playPauseButton: {
		alignItems: 'center',
		marginLeft: 16,
		height: 32,
		width: 32,
		borderRadius: 4,
		justifyContent: 'center'
	},
	seekContainer: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		height: '100%'
	},
	seek: {
		marginRight: 12,
		height: '100%',
		justifyContent: 'center',
		flex: 1
	},
	duration: {
		marginHorizontal: 12,
		fontSize: 14,
		...sharedStyles.textRegular
	},
	containerPlaybackSpeed: {
		width: 36,
		height: 24,
		borderRadius: 4,
		marginRight: 16,
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

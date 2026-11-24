import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

export default StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		paddingHorizontal: 12,
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	playPauseButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		width: 32,
		borderRadius: 4
	},
	details: {
		flex: 1,
		justifyContent: 'center',
		height: '100%'
	},
	title: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textSemibold
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	closeButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		width: 32
	}
});

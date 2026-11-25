import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

export default StyleSheet.create({
	container: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		gap: 8,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12
	},
	details: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: 8
	},
	title: {
		flexShrink: 0,
		maxWidth: '60%',
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textSemibold
	},
	roomName: {
		flexShrink: 1,
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	controls: {
		flexDirection: 'row'
	},
	closeButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		width: 32
	}
});

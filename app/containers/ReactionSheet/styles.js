import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	container: {
		overflow: 'hidden',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16
	},
	separator: {
		marginHorizontal: 16
	},
	content: {
		paddingTop: 16
	},
	handle: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingBottom: 8
	},
	handleIndicator: {
		width: 40,
		height: 4,
		borderRadius: 4,
		margin: 8
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	},
	bottomSheet: {
		width: '50%',
		alignSelf: 'center',
		left: '25%'
	},
	headerContainer: {
		marginHorizontal: 5
	},
	reactionItem: {
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		marginHorizontal: 5
	},
	reactionText: {
		...sharedStyles.textSemibold
	},
	reactionContainer: {
		marginHorizontal: 10
	},
	userItem: {
		padding: 20,
		flexDirection: 'row',
		alignItems: 'center'
	},
	userItemText: {
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 30
	}
});

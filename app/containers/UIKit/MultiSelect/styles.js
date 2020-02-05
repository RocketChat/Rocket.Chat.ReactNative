import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	modal: {
		height: 300,
		width: '100%',
		borderTopRightRadius: 16,
		borderTopLeftRadius: 16,
		overflow: 'hidden'
	},
	content: {
		padding: 16
	},
	keyboardView: {
		width: '100%'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	item: {
		height: 48,
		alignItems: 'center',
		flexDirection: 'row'
	},
	input: {
		minHeight: 48,
		padding: 8,
		paddingBottom: 0,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 2,
		alignItems: 'center',
		flexDirection: 'row'
	},
	icon: {
		position: 'absolute',
		right: 16
	},
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginRight: 16
	},
	chip: {
		flexDirection: 'row',
		borderRadius: 2,
		height: 28,
		alignItems: 'center',
		paddingHorizontal: 4,
		marginBottom: 8,
		marginRight: 8,
		maxWidth: 100
	},
	chipText: {
		maxWidth: 64,
		paddingHorizontal: 8,
		...sharedStyles.textMedium,
		fontSize: 14
	},
	chipImage: {
		marginLeft: 4,
		borderRadius: 2,
		width: 20,
		height: 20
	}
});

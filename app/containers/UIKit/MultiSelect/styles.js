import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	backdrop: {
		...StyleSheet.absoluteFill,
		opacity: 0.3
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
	animatedContent: {
		width: '100%'
	},
	keyboardView: {
		width: '100%'
	},
	pickerText: {
		...sharedStyles.textRegular,
		paddingLeft: 6,
		fontSize: 16
	},
	item: {
		height: 48,
		maxWidth: '85%',
		alignItems: 'center',
		flexDirection: 'row'
	},
	input: {
		minHeight: 48,
		paddingHorizontal: 8,
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
	itemContent: {
		paddingBottom: 36
	},
	items: {
		height: 226
	},
	chips: {
		paddingTop: 8,
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginRight: 50
	},
	chip: {
		flexDirection: 'row',
		borderRadius: 2,
		height: 28,
		alignItems: 'center',
		paddingHorizontal: 4,
		marginBottom: 8,
		marginRight: 8
	},
	chipText: {
		paddingHorizontal: 8,
		flexShrink: 1,
		...sharedStyles.textMedium,
		fontSize: 14
	},
	chipImage: {
		marginLeft: 4,
		borderRadius: 2,
		width: 20,
		height: 20
	},
	itemImage: {
		marginRight: 8,
		borderRadius: 2,
		width: 24,
		height: 24
	}
});

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	item: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingHorizontal: 16,
		alignItems: 'center'
	},
	avatar: {
		marginRight: 16
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 60
	}
});

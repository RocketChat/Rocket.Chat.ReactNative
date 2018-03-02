import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	list: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
	message: {
		transform: [{ scaleY: 1 }]
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff'
	}
});

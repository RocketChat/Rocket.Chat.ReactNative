import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	searchContainer: {
		padding: 20,
		paddingBottom: 0
	},
	list: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
	message: {
		transform: [{ scaleY: 1 }]
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		borderColor: '#ddd',
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 20
	}
});

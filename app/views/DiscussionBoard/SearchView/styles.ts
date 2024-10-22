import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	mainContainer: {
		backgroundColor: '#fff',
		flex: 1
	},
	searchContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginHorizontal: 20,
		marginBottom: 24,
		marginTop: 24,
		borderWidth: 1,
		borderColor: '#000',
		borderRadius: 8,
		padding: 10
	},
	textInput: {
		flex: 1
	},
	searchItemContainer: {
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 1, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 30,
		elevation: 5,
		marginHorizontal: 20
	},
	title: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '500',
		marginBottom: 8
	},
	description: {
		fontSize: 14,
		lineHeight: 19,
		fontWeight: '400'
	},
	searchItemArrow: {
		alignSelf: 'flex-end'
	},
	arrow: {
		height: 15,
		width: 9,
		marginRight: 8
	}
});

export default styles;

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	mainContainer: {
		flex: 1,
		backgroundColor: 'white'
	},
	headerContainer: {
		margin: 20
	},
	headerText: {
		fontSize: 24,
		fontWeight: '600',
		lineHeight: 29
	},
	footer: {
		height: 90
	},
	buttonContainer: {
		position: 'absolute',
		marginHorizontal: 24,
		height: 54,
		borderRadius: 27,
		justifyContent: 'center',
		alignItems: 'center',
		left: 0,
		right: 0,
		bottom: 28,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 100,
		elevation: 5
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		lineHeight: 19
	}
});

export default styles;

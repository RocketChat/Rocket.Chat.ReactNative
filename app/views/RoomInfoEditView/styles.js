import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	inputContainer: {
		marginBottom: 20
	},
	label: {
		marginBottom: 4,
		fontSize: 16
	},
	input: {
		paddingTop: 12,
		paddingBottom: 12,
		paddingHorizontal: 10,
		borderWidth: 2,
		borderRadius: 2,
		backgroundColor: 'white',
		borderColor: 'rgba(0,0,0,.15)',
		color: 'black'
	},
	labelError: {
		color: 'red'
	},
	inputError: {
		color: 'red',
		borderColor: 'red'
	},
	buttonContainerDisabled: {
		backgroundColor: 'rgba(65, 72, 82, 0.7)'
	}
});

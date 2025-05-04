import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		width: '90%',
		padding: 10,
		rowGap: 10
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center'
	},
	instructions: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20
	},
	qrContainer: {
		alignItems: 'center',
		padding: 10,
		borderRadius: 8,
		alignSelf: 'center'
	},
	manualCodeTitle: {
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center'
	},
	copyCodeContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	manualCode: {
		fontSize: 13,
		textAlign: 'center',
		marginTop: 4
	},
	secretCode: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
		backgroundColor: '#f8f9fa',
		borderRadius: 6
	},
	codeInputLabel: {
		fontSize: 14,
		fontWeight: '600'
	},
	codeInput: {
		borderWidth: 1,
		borderRadius: 6,
		padding: 12,
		fontSize: 16
	},
	verifyButton: {
		padding: 14,
		borderRadius: 6,
		alignItems: 'center'
	},

	verifyButtonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16
	}
});

export default styles;

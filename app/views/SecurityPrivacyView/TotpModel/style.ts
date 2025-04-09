import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		width: '80%',
		rowGap: 10
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
		color: '#333'
	},
	instructions: {
		fontSize: 14,
		color: '#555',
		textAlign: 'center',
		lineHeight: 20
	},
	qrContainer: {
		alignItems: 'center',
		padding: 10,
		backgroundColor: 'white',
		borderRadius: 8,
		alignSelf: 'center'
	},
	manualCodeTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333',
		textAlign: 'center'
	},
	manualCode: {
		fontSize: 13,
		color: '#555',
		textAlign: 'center',
		marginTop: 4
	},
	secretCode: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2c3e50',
		textAlign: 'center',
		padding: 10,
		backgroundColor: '#f8f9fa',
		borderRadius: 6
	},
	codeInputLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333'
	},
	codeInput: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 6,
		padding: 12,
		fontSize: 16,
		backgroundColor: '#fff'
	},
	verifyButton: {
		backgroundColor: '#007AFF',
		padding: 14,
		borderRadius: 6,
		alignItems: 'center'
	},
	verifyButtonDisabled: {
		backgroundColor: '#A0C4FF'
	},
	verifyButtonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16
	}
});

export default styles;

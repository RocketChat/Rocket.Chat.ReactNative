import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		width: '100%',
		padding: 26,
		rowGap: 10,
    borderWidth:0.5,
    borderRadius:10
	},
	overlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	title: {
		fontSize: 18,
    marginTop:10,
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
    columnGap:20,
    paddingHorizontal:16,
		alignItems: 'center',
    justifyContent:'center'
	},
	manualCode: {
		fontSize: 13,
		textAlign: 'center',
		marginTop: 4
	},
	secretCode: {
		fontSize: 12,
		fontWeight: 'bold',
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
		fontWeight: 'bold',
		fontSize: 16
	}
});

export default styles;

import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
	container: {
		backgroundColor: 'white',
		flex: 1
	},
	loginView: {
		padding: 20
	},
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		padding: 20,
		alignItems: 'stretch',
		backgroundColor: '#2f343d'
	},
	defaultView: {
		flexDirection: 'column',
		justifyContent: 'center',
		padding: 20,
		alignItems: 'stretch'
	},
	defaultViewBackground: {
		backgroundColor: '#fff'
	},
	logoContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1
	},
	loginLogo: {
		width: Dimensions.get('window').width - 150,
		height: Dimensions.get('window').width - 150,
		resizeMode: 'contain'
	},
	registerLogo: {
		width: Dimensions.get('window').width - 40,
		height: 100,
		resizeMode: 'contain'
	},
	formContainer: {},
	label: {
		lineHeight: 40,
		height: 40,
		fontSize: 16,
		marginBottom: 5,
		color: 'white'
	},
	label_white: {
		lineHeight: 40,
		height: 40,
		fontSize: 16,
		marginBottom: 5,
		color: '#2f343d'
	},
	label_error: {
		color: 'red',
		flexGrow: 1,
		paddingHorizontal: 0,
		marginBottom: 20
	},
	input: {
		height: 45,
		marginBottom: 20,
		borderRadius: 2,
		// padding: 14,
		paddingHorizontal: 10,
		borderWidth: 2,
		backgroundColor: 'rgba(255,255,255,.2)',
		borderColor: '#e1e5e8',
		color: 'white'
	},
	input_white: {
		height: 45,
		marginBottom: 20,
		borderRadius: 2,
		// padding: 14,
		paddingHorizontal: 10,
		borderWidth: 2,
		backgroundColor: 'white',
		borderColor: 'rgba(0,0,0,.15)',
		color: 'black'
	},
	buttonContainer: {
		paddingVertical: 15,
		backgroundColor: '#414852',
		marginBottom: 20
	},
	buttonContainer_white: {
		paddingVertical: 15,
		backgroundColor: '#1d74f5',
		marginBottom: 20
	},
	buttonContainer_inverted: {
		paddingVertical: 15,
		marginBottom: 0
	},
	button: {
		textAlign: 'center',
		color: 'white',
		borderRadius: 2,
		fontWeight: '700'
	},
	button_white: {
		textAlign: 'center',
		color: 'white',
		borderRadius: 2,
		fontWeight: '700'
	},
	button_inverted: {
		textAlign: 'center',
		color: '#414852',
		fontWeight: '700',
		flexGrow: 1
	},
	error: {
		textAlign: 'center',
		color: 'red',
		paddingTop: 5
	},
	loading: {
		flex: 1,
		position: 'absolute',
		backgroundColor: 'rgba(255,255,255,.2)',
		left: 0,
		top: 0
	},
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingHorizontal: 0
	},
	switchLabel: {
		flexGrow: 1,
		paddingHorizontal: 10
	},
	disabledButton: {
		backgroundColor: '#e1e5e8'
	},
	enabledButton: {
		backgroundColor: '#1d74f5'
	},
	link: {
		fontWeight: 'bold'
	},
	loginTermsText: {
		marginTop: 10,
		textAlign: 'center',
		color: '#414852',
		fontSize: 16
	},
	loginSecondaryButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center'
	}
});

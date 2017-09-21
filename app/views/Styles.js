import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#2f343d',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch'
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
	view_white: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		padding: 20,
		alignItems: 'stretch',
		backgroundColor: '#fff'
	},
	logoContainer: {
		flex: 1,
		alignItems: 'center',
		flexGrow: 1,
		justifyContent: 'center'
	},
	logo: {
		width: Dimensions.get('window').width - 30,
		height: Dimensions.get('window').width - 30,
		borderRadius: 5,
		resizeMode: 'contain'
	},
	formContainer: {
		// marginBottom: 20
	},
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
	}
});

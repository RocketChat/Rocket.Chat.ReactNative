import { StyleSheet, Dimensions, Platform } from 'react-native';

import { COLOR_DANGER } from '../constants/colors';

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
	passInput: {
		flex: 1,
		position: 'relative'
	},
	passIcon: {
		position: 'absolute',
		right: 0,
		padding: 10,
		color: 'rgba(0,0,0,.45)'
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
		color: COLOR_DANGER,
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
		paddingVertical: 12,
		marginBottom: 20,
		borderRadius: 2,
		// padding: 14,
		paddingHorizontal: 10,
		borderWidth: 2,
		backgroundColor: 'white',
		borderColor: 'rgba(0,0,0,.15)',
		color: 'black'
	},
	buttonContainerLastChild: {
		marginBottom: 40
	},
	buttonContainer: {
		paddingVertical: 15,
		backgroundColor: '#414852',
		marginBottom: 20,
		borderRadius: 2
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
		color: COLOR_DANGER,
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
		flexWrap: 'wrap',
		justifyContent: 'space-around'
	},
	loginOAuthButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center'
	},
	validText: {
		color: 'green'
	},
	invalidText: {
		color: COLOR_DANGER
	},
	validatingText: {
		color: '#aaa'
	},
	oauthButton: {
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 4,
		borderRadius: 2
	},
	facebookButton: {
		backgroundColor: '#3b5998'
	},
	githubButton: {
		backgroundColor: '#4c4c4c'
	},
	gitlabButton: {
		backgroundColor: '#373d47'
	},
	googleButton: {
		backgroundColor: '#dd4b39'
	},
	linkedinButton: {
		backgroundColor: '#1b86bc'
	},
	meteorButton: {
		backgroundColor: '#de4f4f'
	},
	twitterButton: {
		backgroundColor: '#02acec'
	},
	closeOAuth: {
		position: 'absolute',
		left: 5,
		top: Platform.OS === 'ios' ? 20 : 0,
		backgroundColor: 'transparent'
	},
	oAuthModal: {
		margin: 0
	},
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderWidth: 3,
		borderColor: '#fff',
		borderRadius: 16,
		width: 16,
		height: 16
	},
	alignItemsFlexEnd: {
		alignItems: 'flex-end'
	},
	textAlignRight: {
		textAlign: 'right'
	},
	opacity5: {
		opacity: 0.5
	}
});

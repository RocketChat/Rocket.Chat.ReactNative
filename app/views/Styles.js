import { StyleSheet, Platform } from 'react-native';

import {
	COLOR_DANGER, COLOR_BUTTON_PRIMARY, COLOR_TEXT, COLOR_SEPARATOR
} from '../constants/colors';

export default StyleSheet.create({
	container: {
		backgroundColor: 'white',
		flex: 1
	},
	containerScrollView: {
		padding: 15
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
		color: COLOR_DANGER,
		flexGrow: 1,
		paddingHorizontal: 0,
		marginBottom: 20
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
		fontWeight: '700'
	},
	button_white: {
		textAlign: 'center',
		color: 'white',
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
		paddingHorizontal: 0,
		paddingBottom: 5
	},
	switchLabel: {
		fontSize: 16,
		color: '#2f343d',
		paddingHorizontal: 10
	},
	switchDescription: {
		fontSize: 16,
		color: '#9ea2a8'
	},
	disabledButton: {
		backgroundColor: '#e1e5e8'
	},
	enabledButton: {
		backgroundColor: '#1d74f5'
	},
	link: {
		fontWeight: 'bold',
		color: COLOR_BUTTON_PRIMARY
	},
	loginTermsText: {
		marginBottom: 20,
		color: '#414852',
		fontSize: 13,
		fontWeight: '700'
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
	alignItemsFlexStart: {
		alignItems: 'flex-start'
	},
	textAlignRight: {
		textAlign: 'right'
	},
	opacity5: {
		opacity: 0.5
	},

	loginText: {
		fontWeight: '700',
		color: COLOR_TEXT
	},
	loginTitle: {
		fontSize: 20,
		marginBottom: 20
	},
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR
	},
	separatorTop: {
		borderColor: COLOR_SEPARATOR,
		borderTopWidth: StyleSheet.hairlineWidth
	},
	separatorBottom: {
		borderColor: COLOR_SEPARATOR,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separatorVertical: {
		borderColor: COLOR_SEPARATOR,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth
	}
});

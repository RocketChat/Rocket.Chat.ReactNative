import { StyleSheet, Platform } from 'react-native';

import {
	COLOR_DANGER, COLOR_BUTTON_PRIMARY, COLOR_SEPARATOR, COLOR_TEXT, COLOR_TEXT_DESCRIPTION, COLOR_TITLE, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_PRIMARY, HEADER_BACK
} from '../constants/colors';

export default StyleSheet.create({
	root: {
		flex: 1
	},
	container: {
		backgroundColor: 'white',
		flex: 1
	},
	containerScrollView: {
		padding: 15,
		paddingBottom: 30
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
	buttonContainer_inverted: {
		paddingVertical: 15,
		marginBottom: 0
	},
	button: {
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
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderWidth: 3,
		borderColor: '#fff'
	},
	link: {
		fontWeight: 'bold',
		color: COLOR_BUTTON_PRIMARY
	},
	alignItemsFlexEnd: {
		alignItems: 'flex-end'
	},
	alignItemsFlexStart: {
		alignItems: 'flex-start'
	},
	alignItemsCenter: {
		alignItems: 'center'
	},
	textAlignRight: {
		textAlign: 'right'
	},
	textAlignCenter: {
		textAlign: 'center'
	},
	opacity5: {
		opacity: 0.5
	},
	loginTitle: {
		fontSize: 20,
		marginVertical: 15,
		color: COLOR_TITLE,
		lineHeight: 28
	},
	loginSubtitle: {
		fontSize: 16,
		color: COLOR_TITLE,
		lineHeight: 20,
		marginBottom: 15
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
	},
	textRegular: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '400'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif',
				fontWeight: 'normal'
			}
		})
	},
	textMedium: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '500'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif-medium',
				fontWeight: 'normal'
			}
		})
	},
	textSemibold: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '600'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif',
				fontWeight: 'bold'
			}
		})
	},
	textBold: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '700'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif',
				fontWeight: 'bold'
			}
		})
	},
	textColorTitle: {
		color: COLOR_TITLE
	},
	textColorNormal: {
		color: COLOR_TEXT
	},
	textColorDescription: {
		color: COLOR_TEXT_DESCRIPTION
	},
	textColorHeaderBack: {
		color: HEADER_BACK
	},
	colorPrimary: {
		color: COLOR_PRIMARY
	},
	inputLastChild: {
		marginBottom: 15
	},
	listSafeArea: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	listContentContainer: {
		borderColor: COLOR_SEPARATOR,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_WHITE,
		marginVertical: 10
	},
	notchLandscapeContainer: {
		marginTop: -34,
		paddingHorizontal: 30,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	}
});

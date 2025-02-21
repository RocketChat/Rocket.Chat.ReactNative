import { Platform, StyleSheet, TextStyle } from 'react-native';

import { MAX_SCREEN_CONTENT_WIDTH } from '../lib/constants/tablet';

const defaultTextStyle: TextStyle = {
	textAlign: 'left',
	backgroundColor: 'transparent',
	...Platform.select({
		android: {
			includeFontPadding: false
		}
	})
};

export default StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column'
	},
	containerScrollView: {
		paddingTop: 12,
		paddingHorizontal: 16,
		paddingBottom: 24
	},
	tabletScreenContent: {
		justifyContent: 'center',
		alignSelf: 'center',
		width: MAX_SCREEN_CONTENT_WIDTH
	},
	modalFormSheet: {
		// Following UIModalPresentationFormSheet size
		// this not change on different iPad sizes
		width: 540,
		height: 620,
		overflow: 'hidden',
		borderRadius: 10
	},
	status: {
		position: 'absolute',
		bottom: -2,
		right: -2,
		borderRadius: 10
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
		lineHeight: 28
	},
	loginSubtitle: {
		fontSize: 16,
		lineHeight: 20,
		marginBottom: 15
	},
	separator: {
		height: StyleSheet.hairlineWidth
	},
	separatorTop: {
		borderTopWidth: StyleSheet.hairlineWidth
	},
	separatorBottom: {
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separatorVertical: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separatorLeft: {
		borderLeftWidth: StyleSheet.hairlineWidth
	},
	textRegular: {
		...defaultTextStyle,
		...Platform.select({
			ios: {
				fontFamily: 'Inter',
				fontWeight: '400'
			},
			android: {
				fontFamily: 'Inter-Regular',
				letterSpacing: 0.01
			}
		})
	},
	textMedium: {
		...defaultTextStyle,
		...Platform.select({
			ios: {
				fontFamily: 'Inter',
				fontWeight: '500'
			},
			android: {
				fontFamily: 'Inter-Medium'
			}
		})
	},
	textSemibold: {
		...defaultTextStyle,
		...Platform.select({
			ios: {
				fontFamily: 'Inter',
				fontWeight: '600'
			},
			android: {
				fontFamily: 'Inter-SemiBold'
			}
		})
	},
	textBold: {
		...defaultTextStyle,
		...Platform.select({
			ios: {
				fontFamily: 'Inter',
				fontWeight: '700'
			},
			android: {
				fontFamily: 'Inter-Bold'
			}
		})
	},
	inputLastChild: {
		marginBottom: 15
	}
});

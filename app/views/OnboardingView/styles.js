import { StyleSheet } from 'react-native';

import { verticalScale, scale, moderateScale } from '../../utils/scaling';

const colors = {
	backgroundPrimary: '#1D74F5',
	backgroundSecondary: 'white',

	textColorPrimary: 'white',
	textColorSecondary: '#1D74F5',

	borderColorPrimary: '#1D74F5',
	borderColorSecondary: '#E1E5E8'
};

export default StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: '#fff'
	},
	onboarding: {
		alignSelf: 'center',
		paddingHorizontal: scale(45),
		marginTop: verticalScale(30),
		marginBottom: verticalScale(50),
		maxHeight: verticalScale(250),
		resizeMode: 'contain'
	},
	title: {
		alignSelf: 'center',
		color: '#2F343D',
		fontSize: moderateScale(24),
		height: moderateScale(28),
		lineHeight: moderateScale(28),
		fontWeight: 'bold'
	},
	subtitle: {
		alignSelf: 'center',
		color: '#54585E',
		fontSize: moderateScale(16),
		height: moderateScale(20),
		lineHeight: moderateScale(20),
		fontWeight: 'normal'
	},
	buttonsContainer: {
		marginBottom: verticalScale(10),
		marginTop: verticalScale(30)
	},
	buttonContainer: {
		marginHorizontal: scale(15),
		marginVertical: scale(5),
		flexDirection: 'row',
		height: verticalScale(60),
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: moderateScale(2)
	},
	buttonCenter: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	buttonTitle: {
		fontSize: moderateScale(16),
		fontWeight: '600'
	},
	buttonSubtitle: {
		color: '#9EA2A8',
		fontSize: moderateScale(14),
		height: moderateScale(18)
	},
	buttonIconContainer: {
		width: 65,
		alignItems: 'center',
		justifyContent: 'center'
	},
	buttonIcon: {
		marginHorizontal: scale(10),
		width: 20,
		height: 20
	},
	buttonActive: {
		opacity: 0.5
	},
	button_container_primary: {
		backgroundColor: colors.backgroundPrimary,
		borderColor: colors.borderColorPrimary
	},
	button_container_secondary: {
		backgroundColor: colors.backgroundSecondary,
		borderColor: colors.borderColorSecondary
	},
	button_text_primary: {
		color: colors.textColorPrimary
	},
	button_text_secondary: {
		color: colors.textColorSecondary
	}
});

import { StyleSheet } from 'react-native';

import { verticalScale, moderateScale } from '../../utils/scaling';
import sharedStyles from '../Styles';
import { COLOR_PRIMARY, COLOR_BORDER, COLOR_WHITE } from '../../constants/colors';

const colors = {
	backgroundPrimary: COLOR_PRIMARY,
	backgroundSecondary: 'white',

	textColorPrimary: 'white',
	textColorSecondary: COLOR_PRIMARY,

	borderColorPrimary: COLOR_PRIMARY,
	borderColorSecondary: COLOR_BORDER
};

export default StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: COLOR_WHITE
	},
	onboarding: {
		alignSelf: 'center',
		marginTop: verticalScale(30),
		marginBottom: verticalScale(35),
		maxHeight: verticalScale(150),
		resizeMode: 'contain',
		width: 309,
		height: 250
	},
	title: {
		...sharedStyles.textBold,
		...sharedStyles.textColorNormal,
		letterSpacing: 0,
		fontSize: moderateScale(24),
		alignSelf: 'center',
		marginBottom: verticalScale(8)
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: moderateScale(16),
		color: '#54585E',
		alignSelf: 'center'
	},
	buttonsContainer: {
		marginBottom: verticalScale(10),
		marginTop: verticalScale(30)
	},
	buttonContainer: {
		marginHorizontal: 15,
		marginVertical: 5,
		flexDirection: 'row',
		height: 60,
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 2
	},
	buttonCenter: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	buttonTitle: {
		...sharedStyles.textSemibold,
		fontSize: 17
	},
	buttonSubtitle: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription,
		fontSize: 15
	},
	buttonIconContainer: {
		width: 65,
		alignItems: 'center',
		justifyContent: 'center'
	},
	buttonIcon: {
		marginHorizontal: 10,
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
	},
	closeModal: {
		position: 'absolute',
		left: 15
	}
});

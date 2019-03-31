import { StyleSheet } from 'react-native';

import { COLOR_DANGER, COLOR_SEPARATOR } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	buttonInverted: {
		borderColor: 'rgba(0,0,0,.15)',
		borderWidth: 2,
		borderRadius: 2
	},
	buttonContainerDisabled: {
		backgroundColor: 'rgba(65, 72, 82, 0.7)'
	},
	buttonDanger: {
		borderColor: COLOR_DANGER,
		borderWidth: 2,
		borderRadius: 2
	},
	colorDanger: {
		color: COLOR_DANGER
	},
	switchContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	switchLabelContainer: {
		flex: 1,
		paddingHorizontal: 10
	},
	switchLabelPrimary: {
		fontSize: 16,
		paddingBottom: 6,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal
	},
	switchLabelSecondary: {
		fontSize: 12,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal
	},
	switch: {
		alignSelf: 'center'
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 20
	},
	broadcast: {
		textAlign: 'center',
		...sharedStyles.textSemibold,
		...sharedStyles.textColorNormal
	}
});

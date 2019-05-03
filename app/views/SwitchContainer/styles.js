import { StyleSheet } from 'react-native';

import { COLOR_SEPARATOR } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
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
	}
});

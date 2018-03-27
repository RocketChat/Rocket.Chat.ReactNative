import { StyleSheet } from 'react-native';

import { COLOR_DANGER } from '../../constants/colors';

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
		paddingBottom: 6
	},
	switchLabelSecondary: {
		fontSize: 12
	},
	switch: {
		alignSelf: 'center'
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		borderColor: '#ddd',
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 20
	}
});

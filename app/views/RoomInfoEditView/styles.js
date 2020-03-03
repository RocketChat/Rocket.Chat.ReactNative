import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	button: {
		...sharedStyles.textAlignCenter,
		...sharedStyles.textBold
	},
	buttonInverted: {
		borderWidth: 2,
		borderRadius: 2
	},
	buttonContainerDisabled: {
		opacity: 0.7
	},
	buttonContainer_inverted: {
		paddingVertical: 15,
		marginBottom: 0
	},
	button_inverted: {
		flexGrow: 1
	},
	buttonContainerLastChild: {
		marginBottom: 40
	},
	buttonContainer: {
		paddingVertical: 15,
		marginBottom: 20,
		borderRadius: 2
	},
	buttonDanger: {
		borderWidth: 2,
		borderRadius: 2
	},
	switchContainer: {
		flexDirection: 'row',
		paddingVertical: 5
	},
	switchLabelContainer: {
		flex: 1,
		paddingHorizontal: 8
	},
	switchLabelPrimary: {
		fontSize: 16,
		paddingBottom: 6,
		...sharedStyles.textRegular
	},
	switchLabelSecondary: {
		fontSize: 12,
		...sharedStyles.textRegular
	},
	switch: {
		alignSelf: 'center'
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 20
	},
	broadcast: {
		...sharedStyles.textAlignCenter,
		...sharedStyles.textSemibold
	}
});

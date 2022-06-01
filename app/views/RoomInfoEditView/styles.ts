import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	button: {
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
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
		alignItems: 'flex-start'
	},
	switchLabelContainer: {
		flex: 1,
		paddingHorizontal: 10,
		alignItems: 'flex-end'
	},
	switchLabelPrimary: {
		fontSize: fontSize[14],
		paddingBottom: 6,
		...sharedStyles.textRegular
	},
	switchLabelSecondary: {
		fontSize: fontSize[12],
		...sharedStyles.textRegular,
		textAlign: 'right'
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
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	hideSystemMessages: {
		alignItems: 'flex-start'
	},
	systemMessagesLabel: {
		textAlign: 'left'
	},
	switchMargin: {
		marginBottom: 16
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10
	},
	resetButton: {
		padding: 4,
		borderRadius: 4,
		position: 'absolute',
		bottom: -8,
		right: -8
	}
});

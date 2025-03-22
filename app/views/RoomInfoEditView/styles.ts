import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	button: {
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	buttonInverted: {
		borderWidth: 1,
		borderRadius: 4
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
		borderRadius: 4
	},
	buttonDanger: {
		borderWidth: 1,
		borderRadius: 4
	},
	switchContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	switchLabelContainer: {
		flex: 1,
		alignItems: 'flex-start'
	},
	switchLabelPrimary: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular
	},
	switchLabelSecondary: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	switch: {
		alignSelf: 'center'
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 12
	},
	broadcast: {
		...sharedStyles.textSemibold,
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
		marginBottom: 16,
		marginTop: 16
	},
	resetButton: {
		padding: 4,
		borderRadius: 4,
		position: 'absolute',
		bottom: -8,
		right: -8
	},
	inputs: {
		flex: 1,
		gap: 12
	},
	switches: {
		flex: 1,
		gap: 12,
		marginBottom: 36
	}
});

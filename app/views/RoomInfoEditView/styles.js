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
		alignItems: 'flex-start'
	},
	switchLabelContainer: {
		flex: 1,
		paddingHorizontal: 10,
		alignItems: 'flex-end'
	},
	switchLabelPrimary: {
		fontSize: 16,
		paddingBottom: 6,
		...sharedStyles.textRegular
	},
	switchLabelSecondary: {
		fontSize: 12,
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
		...sharedStyles.textAlignCenter,
		...sharedStyles.textSemibold
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
	avatar: {
		marginHorizontal: 10
	},
	avatarContainer: {
		minHeight: 240,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10
	},
	avatarButtonsContainer: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		flexDirection: 'row'
	},
	avatarUpload: {
		backgroundColor: 'white',
		margin: 3,
		padding: 3,
		paddingHorizontal: 6,
		alignItems: 'center'
	},
	avatarReset: {
		backgroundColor: 'red',
		margin: 3,
		padding: 3,
		paddingHorizontal: 6,
		alignItems: 'center'
	}
});

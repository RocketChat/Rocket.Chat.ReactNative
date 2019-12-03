import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	button: {
		textAlign: 'center',
		color: 'white',
		fontWeight: '700'
	},
	buttonInverted: {
		borderWidth: 2,
		borderRadius: 2
	},
	buttonContainerDisabled: {
		backgroundColor: 'rgba(65, 72, 82, 0.7)'
	},
	buttonContainer_inverted: {
		paddingVertical: 15,
		marginBottom: 0
	},
	button_inverted: {
		textAlign: 'center',
		fontWeight: '700',
		flexGrow: 1
	},
	buttonContainerLastChild: {
		marginBottom: 40
	},
	buttonContainer: {
		paddingVertical: 15,
		backgroundColor: '#414852',
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
		textAlign: 'center',
		...sharedStyles.textSemibold
	}
});

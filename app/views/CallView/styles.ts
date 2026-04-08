import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export const CONTROLS_ANIMATION_DURATION = 300;

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'red'
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'space-between'
	},
	callerInfoContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
		marginBottom: 100
	},
	avatarContainer: {
		marginBottom: 16,
		position: 'relative'
	},
	caller: {
		...sharedStyles.textBold,
		fontSize: 24,
		lineHeight: 32,
		textAlign: 'center',
		marginBottom: 4
	},
	callerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	mutedIndicator: {
		marginLeft: 8
	},
	callerExtension: {
		...sharedStyles.textRegular,
		fontSize: 18,
		lineHeight: 26,
		textAlign: 'center',
		marginBottom: 8
	},
	statusText: {
		...sharedStyles.textRegular,
		fontSize: 18,
		lineHeight: 26,
		textAlign: 'center'
	},
	buttonsContainer: {
		padding: 24,
		paddingBottom: 48,
		gap: 24,
		borderTopWidth: StyleSheet.hairlineWidth,
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0
	},
	buttonsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 48
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 64,
		height: 64,
		borderRadius: 8,
		marginBottom: 8
	},
	actionButtonLabel: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center'
	}
});

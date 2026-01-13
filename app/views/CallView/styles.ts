import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'space-between'
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	headerTitle: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		lineHeight: 24
	},
	headerButton: {
		padding: 8
	},
	callerInfoContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24
	},
	avatarContainer: {
		marginBottom: 16,
		position: 'relative'
	},
	callerName: {
		...sharedStyles.textBold,
		fontSize: 24,
		lineHeight: 32,
		textAlign: 'center',
		marginBottom: 4
	},
	callerNameRow: {
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
		padding: 24
	},
	buttonsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 24
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

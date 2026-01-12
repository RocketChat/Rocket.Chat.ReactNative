import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

// Dark background color matching the mockups
export const CALL_BACKGROUND_COLOR = '#1F2329';

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: CALL_BACKGROUND_COLOR
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'space-between',
		paddingBottom: 32
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
		color: '#FFFFFF'
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
	statusIndicator: {
		position: 'absolute',
		bottom: 4,
		right: 4,
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: '#158D65',
		borderWidth: 2,
		borderColor: CALL_BACKGROUND_COLOR
	},
	callerName: {
		...sharedStyles.textBold,
		fontSize: 24,
		color: '#FFFFFF',
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
		fontSize: 16,
		color: '#9EA2A8',
		textAlign: 'center',
		marginBottom: 8
	},
	statusTextContainer: {
		marginTop: 24
	},
	statusText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		color: '#9EA2A8',
		textAlign: 'center'
	},
	statusTextHighlight: {
		color: '#F5455C'
	},
	buttonsContainer: {
		paddingHorizontal: 24
	},
	buttonsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 24
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 72
	},
	actionButtonIcon: {
		width: 56,
		height: 56,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8
	},
	actionButtonIconDefault: {
		backgroundColor: '#2F343D'
	},
	actionButtonIconActive: {
		backgroundColor: '#FFFFFF'
	},
	actionButtonIconDanger: {
		backgroundColor: '#F5455C'
	},
	actionButtonLabel: {
		...sharedStyles.textRegular,
		fontSize: 12,
		color: '#FFFFFF',
		textAlign: 'center'
	}
});

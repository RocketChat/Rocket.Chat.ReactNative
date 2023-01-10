import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 32
	},
	separator: {
		marginVertical: 16
	},
	itemLabel: {
		marginBottom: 12,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	containerAvatarSuggestion: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	}
});

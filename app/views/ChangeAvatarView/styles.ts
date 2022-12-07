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
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	avatarButton: {
		width: 64,
		height: 64,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 20,
		marginBottom: 12,
		borderRadius: 4
	},
	containerAvatarSuggestion: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	}
});

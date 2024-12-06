import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16
	},
	separator: {
		marginVertical: 24
	},
	itemLabel: {
		marginBottom: 12,
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium
	},
	containerImagesUploaded: {
		flex: 1,
		marginBottom: 36
	},
	containerAvatarSuggestion: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	buttons: {
		gap: 12
	}
});

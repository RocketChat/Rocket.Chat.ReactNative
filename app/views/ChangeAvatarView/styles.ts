import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24
	},
	separator: {
		marginVertical: 16
	},
	itemLabel: {
		marginBottom: 12,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	containerImagesUploaded: {
		flex: 1
	},
	containerAvatarSuggestion: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	}
});

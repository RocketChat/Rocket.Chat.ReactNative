import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	safeAreaView: {
		flex: 1
	},
	reactionSearchContainer: {
		marginHorizontal: 12,
		marginBottom: 8
	},
	reactionPickerContainer: {
		flex: 1,
		flexDirection: 'column'
	},
	bannerContainer: {
		paddingVertical: 12,
		paddingHorizontal: 15,
		flexDirection: 'row',
		alignItems: 'center'
	},
	bannerText: {
		flex: 1
	},
	bannerModalTitle: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	modalView: {
		padding: 20,
		justifyContent: 'center'
	},
	modalScrollView: {
		maxHeight: 100,
		marginVertical: 20
	},
	modalCloseButton: {
		alignSelf: 'flex-end'
	},
	searchbarContainer: {
		height: 56,
		marginBottom: 8,
		paddingHorizontal: 12
	},
	reactionPickerSearchbar: {
		paddingHorizontal: 20,
		minHeight: 48
	}
});

import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	serversListContainerHeader: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		flexDirection: 'row'
	},
	groupTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	groupTitle: {
		fontSize: 16,
		flex: 1,
		lineHeight: 24,
		...sharedStyles.textBold
	},
	serverHeader: {
		justifyContent: 'space-between'
	},
	serverHeaderText: {
		fontSize: 16,
		marginLeft: 12,
		...sharedStyles.textRegular
	},
	serverHeaderAdd: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular
	},
	buttonCreateWorkspace: {
		justifyContent: 'center',
		marginBottom: 0,
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 4
	},
	addServerButtonContainer: {
		padding: 16
	}
});

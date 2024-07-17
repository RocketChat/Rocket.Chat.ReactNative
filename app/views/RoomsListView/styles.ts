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
		paddingHorizontal: 12,
		paddingTop: 17,
		paddingBottom: 10
	},
	groupTitle: {
		fontSize: 16,
		letterSpacing: 0.27,
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
		marginRight: 12,
		paddingVertical: 10,
		...sharedStyles.textRegular
	},
	buttonCreateWorkspace: {
		height: 46,
		justifyContent: 'center',
		marginBottom: 0
	}
});

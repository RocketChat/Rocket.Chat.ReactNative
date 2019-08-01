import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';

import {
	COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_DANGER
} from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	emptyContainer: {
		padding: 20,
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		flex: 1,
		backgroundColor: isIOS ? COLOR_WHITE : '#E1E5E8',
		justifyContent: 'center',
		alignItems: 'center'
	},
	centered: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	flatlist: {
		marginTop: isIOS ? 6 : 0, // the height of the navigation bar with the searchbar is larger
		width: '100%',
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	bordered: {
		...sharedStyles.separatorVertical
	},
	borderBottom: {
		...sharedStyles.separatorBottom
	},
	headerContainer: {
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingBottom: 10,
		paddingTop: 17
	},
	headerText: {
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular,
		fontSize: 17,
		letterSpacing: 0.27
	},
	separator: {
		...sharedStyles.separatorBottom,
		marginLeft: 48
	},
	loading: {
		flex: 1
	},
	errorIcon: {
		color: COLOR_DANGER
	},
	fileMime: {
		...sharedStyles.textColorNormal,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter,
		fontSize: 20,
		marginBottom: 20
	},
	title: {
		fontSize: 14,
		...sharedStyles.textColorTitle,
		...sharedStyles.textBold
	}
});

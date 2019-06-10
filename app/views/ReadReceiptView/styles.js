import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR, COLOR_WHITE, COLOR_BACKGROUND_CONTAINER } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	item: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR
	},
	name: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorTitle,
		fontSize: 17
	},
	username: {
		flex: 1,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription,
		fontSize: 14
	},
	infoContainer: {
		flex: 1,
		marginLeft: 10
	},
	itemContainer: {
		flex: 1,
		flexDirection: 'row',
		padding: 10,
		backgroundColor: COLOR_WHITE
	},
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	list: {
		...sharedStyles.separatorVertical,
		marginVertical: 10
	}
});

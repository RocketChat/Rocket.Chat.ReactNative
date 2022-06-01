import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	noDataFound: {
		fontSize: fontSize[14],
		...sharedStyles.textRegular
	},
	contentContainer: {
		paddingBottom: 30
	},
	dropdownContainer: {
		width: '100%',
		position: 'absolute',
		top: 0,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	}
});

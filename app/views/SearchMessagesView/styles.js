import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR } from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	searchContainer: {
		padding: 20,
		paddingBottom: 0
	},
	list: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
	message: {
		transform: [{ scaleY: 1 }]
	},
	divider: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginVertical: 20
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		backgroundColor: '#ffffff'
	}
});

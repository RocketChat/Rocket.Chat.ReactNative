import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		backgroundColor: '#F6F7F9'
	},
	sectionItem: {
		backgroundColor: '#ffffff',
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	sectionItemDisabled: {
		opacity: 0.3
	},
	sectionItemIcon: {
		width: 45,
		textAlign: 'center'
	},
	sectionItemName: {
		flex: 1
	},
	sectionItemDescription: {
		color: '#ccc'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#ddd'
	},
	sectionSeparator: {
		height: 10,
		backgroundColor: '#F6F7F9'
	},
	sectionSeparatorBorder: {
		borderColor: '#EBEDF1',
		borderTopWidth: 1
	},
	textColorDanger: {
		color: '#f5455c'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitleContainer: {
		flex: 1
	},
	roomTitle: {
		fontSize: 16
	},
	roomDescription: {
		fontSize: 12,
		color: '#ccc'
	}
});

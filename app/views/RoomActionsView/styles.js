import { StyleSheet } from 'react-native';

const dangerColor = '#f5455c';

export default StyleSheet.create({
	container: {
		backgroundColor: '#F6F7F9'
	},
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	sectionItem: {
		backgroundColor: '#ffffff',
		paddingVertical: 10,
		flexDirection: 'row',
		alignItems: 'center'
	},
	sectionItemIcon: {
		width: 45,
		textAlign: 'center'
	},
	sectionItemName: {
		flex: 1
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
		color: dangerColor
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
		fontWeight: '500',
		color: '#cbced1'
	}
});

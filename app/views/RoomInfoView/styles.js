import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: '#ffffff',
		padding: 10
	},
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	item: {
		padding: 10,
		// borderColor: '#EBEDF1',
		// borderTopWidth: StyleSheet.hairlineWidth,
		justifyContent: 'center'
	},
	avatarContainer: {
		height: 250,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitle: {
		fontSize: 18,
		paddingTop: 20
	},
	roomDescription: {
		fontSize: 14,
		color: '#ccc',
		paddingTop: 10
	},
	status: {
		borderRadius: 24,
		width: 24,
		height: 24,
		borderWidth: 4,
		bottom: -4,
		right: -4
	},
	itemLabel: {
		fontWeight: '600',
		marginBottom: 10
	},
	itemContent: {
		color: '#ccc'
	},
	itemContent__empty: {
		fontStyle: 'italic'
	},
	rolesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	roleBadge: {
		padding: 8,
		backgroundColor: '#ddd',
		borderRadius: 2,
		marginRight: 5,
		marginBottom: 5
	}
});

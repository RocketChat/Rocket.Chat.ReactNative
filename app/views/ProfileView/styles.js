import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10
	},
	avatarButtons: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		justifyContent: 'flex-start'
	},
	avatarButton: {
		backgroundColor: '#e1e5e8',
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 15,
		marginBottom: 15,
		borderRadius: 2
	},
	dialogInput: Platform.select({
		ios: {},
		android: {
			borderRadius: 4,
			borderColor: 'rgba(0,0,0,.15)',
			borderWidth: 2,
			paddingHorizontal: 10
		}
	})
});

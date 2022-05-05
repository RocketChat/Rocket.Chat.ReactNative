import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
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
		width: 48,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
		marginBottom: 24,
		borderRadius: 2
	}
});

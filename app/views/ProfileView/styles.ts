import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatarButtons: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		justifyContent: 'flex-start'
	},
	avatarButton: {
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 15,
		marginBottom: 15,
		borderRadius: 4
	},
	inputContainer: {
		marginBottom: 0,
		marginTop: 0
	},
	inputBio: {
		height: 100,
		textAlignVertical: 'top'
	},
	inputs: {
		gap: 12,
		marginTop: 16,
		marginBottom: 36
	}
});

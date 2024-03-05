import { StyleSheet } from 'react-native';

import { themeColors } from '../../../lib/constants';

const styles = StyleSheet.create({
	mainContainer: {
		backgroundColor: '#fff',
		paddingHorizontal: 20
	},
	boardContainer: {
		marginTop: 20
	},
	titleText: {
		fontSize: 14,
		fontWeight: '400',
		color: '#090909',
		lineHeight: 20
	},
	discussionBoard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		height: 54,
		alignItems: 'center'
	},
	boardIconContainer: {
		height: 40,
		width: 40,
		justifyContent: 'center',
		alignItems: 'center'
	},
	discussionIcon: {
		height: 20,
		width: 20
	},
	dropdown: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8,
		justifyContent: 'space-between'
	},
	dropdownText: {},
	dropdownIcon: {
		width: 8,
		height: 4
	},
	titleContainer: {
		marginTop: 24
	},
	textInput: {
		marginVertical: 17,
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '500'
	},
	largeTextInput: {
		minHeight: 200,
		fontSize: 14,
		lineHeight: 19,
		fontWeight: '400'
	},
	descriptionContainer: {
		marginTop: 12
	},
	selectImageContainer: {},
	bannerImage: {
		borderRadius: 20
	},
	selectImage: {
		height: 24,
		width: 20
	},
	buttonContainer: {
		position: 'absolute',
		bottom: 40,
		left: 20,
		right: 20
	},
	button: {
		backgroundColor: themeColors.mossGreen,
		height: 54,
		borderRadius: 27,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.15,
		shadowRadius: 10,
		elevation: 5
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
		lineHeight: 19
	},
	footer: {
		height: 120
	}
});

export default styles;

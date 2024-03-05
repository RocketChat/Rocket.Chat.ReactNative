import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	mainContainer: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 20
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	profileImage: {
		height: 24,
		width: 24,
		borderRadius: 12
	},
	profileNameContainer: {
		flex: 1,
		marginLeft: 15
	},
	profileName: {
		fontWeight: '400',
		fontSize: 14,
		lineHeight: 20
	},
	moreMenuIcon: {
		width: 14,
		height: 4,
		borderRadius: 25
	},
	content: {
		marginVertical: 16
	},
	title: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '600',
		color: '#000',
		marginBottom: 8
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '400',
		color: '#000'
		// marginBottom: 8
	},
	postDate: {
		marginTop: 8,
		color: '#00000080',
		fontSize: 10,
		fontWeight: '400',
		lineHeight: 12
	},
	banner: {
		width: '100%',
		height: 160,
		marginBottom: 16,
		borderRadius: 20
	},
	icon: {
		width: 15,
		height: 15
	},
	reactions: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	reactionText: {
		marginLeft: 6,
		color: '#000',
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '400',
		marginRight: 24
	},
	postContainer: {
		marginBottom: 36
	},
	commentsTitle: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '400',
		color: '#000',
		marginBottom: 30
	},
	comment: {
		marginLeft: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#E3E3E3',
		marginBottom: 20
	},
	commentHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12
	},
	commentProfileImage: {
		width: 24,
		height: 24,
		borderRadius: 12
	},
	commentUsernameContainer: {
		flex: 1,
		marginLeft: 12
	},
	commentUsername: {
		fontWeight: '400',
		fontSize: 12,
		lineHeight: 15,
		color: '#000'
	},
	commentOptions: {
		height: 16,
		width: 16,
		justifyContent: 'center',
		alignItems: 'center'
	},
	commentOptionsIcon: {
		width: 16,
		height: 4
	},
	commentText: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '400',
		color: '#000'
	},
	commentFooter: {
		marginVertical: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	commentDate: {
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '400',
		color: '#00000080'
	},
	commentReactions: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	commentReactionIcon: {
		height: 14,
		width: 14,
		marginRight: 6
	},
	commentReactionText: {
		fontSize: 10,
		lineHeight: 12,
		fontWeight: '400',
		color: '#000000'
	},
	addCommentContainer: {
		position: 'absolute',
		bottom: 10,
		// elevation: 10,
		left: 0,
		right: 0,
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 100,
		borderTopLeftRadius: 25,
		borderTopRightRadius: 25,
		paddingTop: 33,
		paddingHorizontal: 20,
		elevation: 5
	},
	textInputContainer: {
		width: '100%',
		backgroundColor: '#efefef80',
		borderRadius: 8,
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'flex-end',
		paddingVertical: 14,
		paddingHorizontal: 12,
		maxHeight: 160
	},
	textInput: {
		flex: 1,
		marginRight: 8,
		fontSize: 14,
		lineHeight: 20
	},
	sendIcon: {
		height: 20,
		width: 20
	}
});

export default styles;

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import PopUpModal from '../Components/PopUpModal';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';
import { DeleteType, PostDeleteModalProps } from './interfaces';

const trash = require('../../../static/images/discussionboard/trash.png');

const PostDeleteModal: React.FC<PostDeleteModalProps> = props => {
	const { show, type = DeleteType.COMMENT, close, delete: deleteAction } = props;
	// const { theme } = useTheme();
	const theme = 'light';

	const [disableButton, setDisableButton] = React.useState(false);

	const isComment = type === DeleteType.COMMENT;

	return (
		<PopUpModal show={show} close={close} customStyles={styles.container}>
			<View style={styles.header}>
				<Image source={trash} style={styles.trashIcon} />
				<Text style={styles.headerText}>{`Delete ${isComment ? 'Comment' : 'Post'}`}</Text>
			</View>
			<Text style={styles.text}>{`Are you sure you want to delete this ${isComment ? 'comment' : 'Post'}?`}</Text>
			<TouchableOpacity style={{ ...styles.delete, backgroundColor: themes[theme].mossGreen }} onPress={deleteAction}>
				<Text style={styles.deleteText}>Delete</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={{ ...styles.cancel, borderColor: themes[theme].mossGreen }}
				onPress={() => {
					setDisableButton(true);
					setTimeout(() => {
						setDisableButton(false);
						close();
					}, 500);
				}}
				disabled={disableButton}
			>
				<Text style={styles.cancelText}>Cancel</Text>
			</TouchableOpacity>
		</PopUpModal>
	);
};

export default PostDeleteModal;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16
	},
	trashIcon: {
		height: 24,
		width: 24,
		marginRight: 16
	},
	headerText: {
		fontSize: 24,
		lineHeight: 29,
		fontWeight: '600'
	},
	text: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '400',
		marginBottom: 12,
		marginHorizontal: 40,
		textAlign: 'center'
	},
	delete: {
		borderRadius: 30,
		width: '100%',
		marginBottom: 16,
		justifyContent: 'center',
		alignItems: 'center',
		height: 54
	},
	deleteText: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '600',
		color: '#FFF'
	},
	cancel: {
		borderWidth: 1,
		borderRadius: 30,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		height: 54,
		marginBottom: 20
	},
	cancelText: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '600'
	}
});

import React from 'react';
import { Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import PopUpModal from '../Components/PopUpModal';
import { CommentOptionsModalProps } from './interfaces';
import { Services } from '../../../lib/services';
import { getRoomTitle, getUidDirectMessage } from '../../../lib/methods/helpers';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import { IApplicationState } from '../../../definitions';
import { getUserSelector } from '../../../selectors/login';

const commentBox = require('../../../static/images/discussionboard/comment_box.png');
const alert = require('../../../static/images/discussionboard/alert_circle.png');
const trash = require('../../../static/images/discussionboard/trash.png');

const CommentOptionsModal: React.FC<CommentOptionsModalProps> = props => {
	const navigation = useNavigation<StackNavigationProp<any>>();
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const user = useSelector((state: IApplicationState) => getUserSelector(state));

	const { show, comment, close, onDelete, onReport, showDelete, showMessage } = props;
	const username = comment?.user?.username;
	const name = comment?.user?.name;
	const ownComment = comment?.user?.username === user?.username;

	const onChat = async () => {
		const result = await Services.createDirectMessage(username);
		if (result.success) {
			const {
				room: { rid }
			} = result;
			if (rid) {
				const room = { rid, t: 'd' };
				const params = {
					rid: room.rid,
					name: getRoomTitle(room),
					t: room.t,
					roomUserId: getUidDirectMessage(room)
				};

				if (room.rid) {
					try {
						close();
						navigation.navigate('RoomsListView');
						goRoom({ item: params, isMasterDetail, popToRoot: true });
					} catch (e) {
						console.log('err', e);
					}
				}
			}
		}
	};

	return (
		<PopUpModal show={show} close={close}>
			{name && !ownComment && showMessage && (
				<TouchableOpacity style={styles.container} onPress={() => onChat()}>
					<Image source={commentBox} style={styles.icon} />
					<Text style={styles.text}>{`Message ${name}`}</Text>
				</TouchableOpacity>
			)}
			{!ownComment && (
				<TouchableOpacity style={styles.container} onPress={() => onReport()}>
					<Image source={alert} style={styles.icon} />
					<Text style={styles.text}>Report comment</Text>
				</TouchableOpacity>
			)}
			{showDelete && ownComment && (
				<TouchableOpacity style={{ ...styles.container, ...styles.noBorder }} onPress={() => onDelete()}>
					<Image source={trash} style={styles.icon} />
					<Text style={styles.text}>Delete comment</Text>
				</TouchableOpacity>
			)}
		</PopUpModal>
	);
};

export default CommentOptionsModal;

const styles = StyleSheet.create({
	container: {
		height: 66,
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#00000033'
	},
	noBorder: {
		borderBottomWidth: 0
	},
	icon: {
		height: 18,
		width: 18,
		marginLeft: 27,
		marginRight: 18
	},
	text: {
		fontSize: 16,
		lineHeight: 19,
		fontWeight: '500'
	}
});

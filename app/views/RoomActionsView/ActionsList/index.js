import React, { memo } from 'react';
import { View, ScrollView } from 'react-native';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import RocketChat from '../../../lib/rocketchat';

import ActionItem from './ActionItem';
import RoomItem from './RoomItem';

import scrollPersistTaps from '../../../utils/scrollPersistTaps';
import styles from './styles';

const areEqual = (prev, next) => isEqual(prev.room, next.room)
	&& prev.baseUrl === next.baseUrl
	&& prev.member._id === next.member._id
	&& prev.membersCount === next.membersCount
	&& prev.canViewMembers === next.canViewMembers
	&& prev.canAddUser === next.canAddUser
	&& prev.canAutoTranslate === next.canAutoTranslate
	&& prev.joined === next.joined
	&& prev.jitsiEnabled === next.jitsiEnabled;

const ActionsList = memo(({
	room,
	baseUrl,
	user,
	member,
	membersCount,
	canViewMembers,
	canAddUser,
	canAutoTranslate,
	joined,
	jitsiEnabled,
	handleShare,
	toggleBlockUser,
	leaveChannel,
	navigation
}) => {
	const { navigate } = navigation;
	const {
		rid, t, blocker
	} = room;

	return (
		<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.container}>

			<RoomItem
				name={I18n.t('Room_Info')}
				baseUrl={baseUrl}
				route='RoomInfoView'
				params={{ rid, t, room }} // forward room only if room isn't joined
				user={user}
				member={member}
				testID='room-actions-info'
			/>
			<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />

			{jitsiEnabled && (
			<>
				<ActionItem
					icon='livechat'
					name={I18n.t('Voice_call')}
					onPress={() => RocketChat.callJitsi(rid, true)}
					testID='room-actions-voice'
				/>
				<View style={styles.separator} />
				<ActionItem
					icon='video'
					name={I18n.t('Video_call')}
					onPress={() => RocketChat.callJitsi(rid)}
					testID='room-actions-video'
				/>
				<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />
			</>
			)}

			{(t === 'c' || t === 'p') && canViewMembers && (
			<>
				<ActionItem
					icon='team'
					name={I18n.t('Members')}
					description={membersCount > 0 ? `${ membersCount } ${ I18n.t('members') }` : null}
					onPress={() => navigate('RoomMembersView', { rid, room })}
					testID='room-actions-members'
				/>
				<View style={styles.separator} />
			</>
			)}
			{(t === 'c' || t === 'p') && canAddUser && (
			<>
				<ActionItem
					icon='user-plus'
					name={I18n.t('Add_user')}
					onPress={() => navigate('SelectedUsersView', { nextActionID: 'ADD_USER', rid, title: I18n.t('Add_user') })}
					testID='room-actions-add-user'
				/>
				<View style={styles.separator} />
			</>
			)}
			<ActionItem
				icon='file-generic'
				name={I18n.t('Files')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Files' })}
				testID='room-actions-files'
			/>
			<View style={styles.separator} />
			<ActionItem
				icon='at'
				name={I18n.t('Mentions')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Mentions' })}
				testID='room-actions-mentioned'
			/>
			<View style={styles.separator} />
			<ActionItem
				icon='star'
				name={I18n.t('Starred')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Starred' })}
				testID='room-actions-starred'
			/>
			<View style={styles.separator} />
			<ActionItem
				icon='magnifier'
				name={I18n.t('Search')}
				onPress={() => navigate('SearchMessagesView', { rid })}
				testID='room-actions-search'
			/>
			<View style={styles.separator} />
			<ActionItem
				icon='share'
				name={I18n.t('Share')}
				onPress={handleShare}
				testID='room-actions-share'
			/>
			<View style={styles.separator} />
			<ActionItem
				icon='pin'
				name={I18n.t('Pinned')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Pinned' })}
				testID='room-actions-pinned'
			/>
			<View style={styles.separator} />
			{canAutoTranslate && (
			<>
				<ActionItem
					icon='language'
					name={I18n.t('Auto_Translate')}
					onPress={() => navigate('AutoTranslateView', { rid, room })}
					testID='room-actions-auto-translate'
				/>
				<View style={styles.separator} />
			</>
			)}
			{t === 'd' && (
				<ActionItem
					icon='bell'
					name={I18n.t('Notifications')}
					onPress={() => navigate('NotificationPrefView', { rid, room })}
					testID='room-actions-notifications'
				/>
			)}
			{(t === 'c' || t === 'p') && joined && (
				<ActionItem
					icon='bell'
					name={I18n.t('Notifications')}
					onPress={() => navigate('NotificationPrefView', { rid, room })}
					testID='room-actions-notifications'
				/>
			)}
			<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />

			{t === 'd' && (
			<>
				<ActionItem
					icon='ban'
					name={I18n.t(`${ blocker ? 'Unblock' : 'Block' }_user`)}
					type='danger'
					onPress={toggleBlockUser}
					testID='room-actions-block-user'
				/>
				<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />
			</>
			)}

			{(t === 'c' || t === 'p') && joined && (
			<>
				<ActionItem
					icon='sign-out'
					name={I18n.t('Leave_channel')}
					type='danger'
					onPress={leaveChannel}
					testID='room-actions-leave-channel'
				/>
				<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />
			</>
			)}

		</ScrollView>
	);
}, areEqual);

ActionsList.propTypes = {
	room: PropTypes.object.isRequired,
	baseUrl: PropTypes.string.isRequired,
	user: PropTypes.shape.isRequired,
	member: PropTypes.object.isRequired,
	membersCount: PropTypes.number.isRequired,
	jitsiEnabled: PropTypes.bool.isRequired,
	joined: PropTypes.bool.isRequired,
	canViewMembers: PropTypes.bool.isRequired,
	canAutoTranslate: PropTypes.bool.isRequired,
	canAddUser: PropTypes.bool.isRequired,
	handleShare: PropTypes.func.isRequired,
	toggleBlockUser: PropTypes.func.isRequired,
	leaveChannel: PropTypes.func.isRequired,
	navigation: PropTypes.shape({
		navigate: PropTypes.func
	}).isRequired
};

export default ActionsList;

import React, { memo } from 'react';
import { View, ScrollView } from 'react-native';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import RocketChat from '../../../lib/rocketchat';

import Item from './Item';
import Header from './Header';

import scrollPersistTaps from '../../../utils/scrollPersistTaps';
import styles from './styles';

const List = memo(({
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

	const isPublicOrPrivate = t === 'c' || t === 'p';

	return (
		<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.container}>

			<Header
				name={I18n.t('Room_Info')}
				baseUrl={baseUrl}
				room={room}
				user={user}
				member={member}
				onPress={() => navigate('RoomInfoView', { rid, t, room })} // forward room only if room isn't joined
				testID='room-actions-info'
			/>
			<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />

			{jitsiEnabled && (
				<>
					<Item
						icon='livechat'
						name={I18n.t('Voice_call')}
						onPress={() => RocketChat.callJitsi(rid, true)}
						testID='room-actions-voice'
					/>
					<View style={styles.separator} />
					<Item
						icon='video'
						name={I18n.t('Video_call')}
						onPress={() => RocketChat.callJitsi(rid)}
						testID='room-actions-video'
					/>
					<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />
				</>
			)}

			{isPublicOrPrivate && canViewMembers && (
				<>
					<Item
						icon='team'
						name={I18n.t('Members')}
						description={membersCount > 0 ? `${ membersCount } ${ I18n.t('members') }` : null}
						onPress={() => navigate('RoomMembersView', { rid, room })}
						testID='room-actions-members'
					/>
					<View style={styles.separator} />
				</>
			)}
			{isPublicOrPrivate && canAddUser && (
				<>
					<Item
						icon='user-plus'
						name={I18n.t('Add_user')}
						onPress={() => navigate('SelectedUsersView', { nextActionID: 'ADD_USER', rid, title: I18n.t('Add_user') })}
						testID='room-actions-add-user'
					/>
					<View style={styles.separator} />
				</>
			)}
			<Item
				icon='file-generic'
				name={I18n.t('Files')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Files' })}
				testID='room-actions-files'
			/>
			<View style={styles.separator} />
			<Item
				icon='at'
				name={I18n.t('Mentions')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Mentions' })}
				testID='room-actions-mentioned'
			/>
			<View style={styles.separator} />
			<Item
				icon='star'
				name={I18n.t('Starred')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Starred' })}
				testID='room-actions-starred'
			/>
			<View style={styles.separator} />
			<Item
				icon='magnifier'
				name={I18n.t('Search')}
				onPress={() => navigate('SearchMessagesView', { rid })}
				testID='room-actions-search'
			/>
			<View style={styles.separator} />
			<Item
				icon='share'
				name={I18n.t('Share')}
				onPress={handleShare}
				testID='room-actions-share'
			/>
			<View style={styles.separator} />
			<Item
				icon='pin'
				name={I18n.t('Pinned')}
				onPress={() => navigate('MessagesView', { rid, t, name: 'Pinned' })}
				testID='room-actions-pinned'
			/>
			<View style={styles.separator} />
			{canAutoTranslate && (
				<>
					<Item
						icon='language'
						name={I18n.t('Auto_Translate')}
						onPress={() => navigate('AutoTranslateView', { rid, room })}
						testID='room-actions-auto-translate'
					/>
					<View style={styles.separator} />
				</>
			)}
			{t === 'd' && (
				<Item
					icon='bell'
					name={I18n.t('Notifications')}
					onPress={() => navigate('NotificationPrefView', { rid, room })}
					testID='room-actions-notifications'
				/>
			)}
			{isPublicOrPrivate && joined && (
				<Item
					icon='bell'
					name={I18n.t('Notifications')}
					onPress={() => navigate('NotificationPrefView', { rid, room })}
					testID='room-actions-notifications'
				/>
			)}
			<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />

			{t === 'd' && (
				<>
					<Item
						icon='ban'
						name={I18n.t(`${ blocker ? 'Unblock' : 'Block' }_user`)}
						type='danger'
						onPress={toggleBlockUser}
						testID='room-actions-block-user'
					/>
					<View style={[styles.sectionSeparator, styles.sectionSeparatorBorder]} />
				</>
			)}

			{isPublicOrPrivate && joined && (
				<>
					<Item
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
}, isEqual);

List.propTypes = {
	room: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.shape,
	member: PropTypes.object,
	membersCount: PropTypes.number,
	jitsiEnabled: PropTypes.bool,
	joined: PropTypes.bool,
	canViewMembers: PropTypes.bool,
	canAutoTranslate: PropTypes.bool,
	canAddUser: PropTypes.bool,
	handleShare: PropTypes.func,
	toggleBlockUser: PropTypes.func,
	leaveChannel: PropTypes.func,
	navigation: PropTypes.object
};

export default List;

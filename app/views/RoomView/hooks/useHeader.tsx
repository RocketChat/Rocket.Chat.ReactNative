import { useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';

import RoomHeader from '../../../containers/RoomHeader';
import { getRoomTitle, isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type IOmnichannelSource, type ISubscription, type IVisitor, type SubscriptionType } from '../../../definitions';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import LeftButtons from '../LeftButtons';
import RightButtons from '../RightButtons';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';

interface IUseHeaderParams {
	rid?: string;
	tmid?: string;
	roomType?: SubscriptionType;
	roomName?: string;
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	unreadsCount: IRoomViewState['unreadsCount'];
	roomUserId: IRoomViewState['roomUserId'];
	joined: IRoomViewState['joined'];
	canForwardGuest: IRoomViewState['canForwardGuest'];
	canReturnQueue: IRoomViewState['canReturnQueue'];
	canPlaceLivechatOnHold: IRoomViewState['canPlaceLivechatOnHold'];
	showMissingE2EEKey: IRoomViewState['showMissingE2EEKey'];
	showE2EEDisabledRoom: IRoomViewState['showE2EEDisabledRoom'];
	navigation: IRoomViewProps['navigation'];
	isMasterDetail: boolean;
	baseUrl: string;
	user: IRoomViewProps['user'];
	goRoomActionsView: (screen?: keyof ModalStackParamList) => void;
	toggleFollowThread: (isFollowingThread: boolean, tmid?: string) => Promise<void>;
	showActionSheet: (options: any) => void;
}

export const useHeader = (params: IUseHeaderParams): void => {
	'use memo';

	const {
		rid,
		tmid,
		roomType,
		roomName,
		room,
		roomUpdate,
		unreadsCount,
		roomUserId,
		joined,
		canForwardGuest,
		canReturnQueue,
		canPlaceLivechatOnHold,
		showMissingE2EEKey,
		showE2EEDisabledRoom,
		navigation,
		isMasterDetail,
		baseUrl,
		user,
		goRoomActionsView,
		toggleFollowThread,
		showActionSheet
	} = params;

	// The room model mutates in place, so tracked-column changes keep the same `room` reference.
	// `roomUpdate` is a fresh snapshot per emit and is the dependency that re-fires the header.
	useLayoutEffect(() => {
		if (!rid) {
			// Adding an empty View to prevent rendering the back button while maintaining the same header height.
			const height = 37 * PixelRatio.getFontScale();
			navigation.setOptions({ headerLeft: () => <View style={{ height }} /> });
			return;
		}
		if (!room.rid) {
			return;
		}

		const prid = room?.prid;
		const isGroupChatConst = isGroupChat(room as ISubscription);
		let title = roomName;
		let parentTitle = '';
		// TODO: I think it's safe to remove this, but we need to test tablet without rooms
		if (!tmid) {
			title = getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = getRoomTitle(room);
		}
		let subtitle: string | undefined;
		let teamId: string | undefined;
		let encrypted: boolean | undefined;
		let userId: string | undefined;
		let token: string | undefined;
		let avatar: string | undefined;
		let visitor: IVisitor | undefined;
		let sourceType: IOmnichannelSource | undefined;
		let departmentId: string | undefined;
		if ('id' in room) {
			subtitle = room.topic;
			teamId = room.teamId;
			encrypted = room.encrypted;
			({ id: userId, token } = user);
			avatar = room.name;
			visitor = room.visitor;
			departmentId = room.departmentId;
		}

		if ('source' in room) {
			sourceType = room.source;
			visitor = room.visitor;
		}

		const t = room?.t;
		const teamMain = 'teamMain' in room ? room?.teamMain : false;
		const omnichannelPermissions = { canForwardGuest, canReturnQueue, canPlaceLivechatOnHold };
		const iSubRoom = room as ISubscription;
		const e2eeWarning = !!('encrypted' in room && (showMissingE2EEKey || showE2EEDisabledRoom));
		navigation.setOptions({
			headerLeft: () => (
				<LeftButtons
					rid={rid}
					tmid={tmid}
					unreadsCount={unreadsCount}
					baseUrl={baseUrl}
					userId={userId}
					token={token}
					title={avatar}
					t={t}
					goRoomActionsView={goRoomActionsView}
					isMasterDetail={isMasterDetail}
				/>
			),
			headerTitle: () => (
				<RoomHeader
					prid={prid}
					tmid={tmid}
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					isGroupChat={isGroupChatConst}
					onPress={goRoomActionsView}
					testID={`room-view-title-${title}`}
					sourceType={sourceType}
					abacAttributes={iSubRoom.abacAttributes}
					disabled={isInviteSubscription(iSubRoom)}
				/>
			),
			headerRight: () => (
				<RightButtons
					roomName={title}
					rid={rid}
					tmid={tmid}
					teamId={teamId}
					joined={joined}
					status={room.status}
					omnichannelPermissions={omnichannelPermissions}
					t={(roomType || t) as SubscriptionType}
					encrypted={encrypted}
					navigation={navigation}
					toggleFollowThread={toggleFollowThread}
					showActionSheet={showActionSheet}
					departmentId={departmentId}
					notificationsDisabled={iSubRoom?.disableNotifications}
					hasE2EEWarning={e2eeWarning}
					teamMain={teamMain}
					isGroupChat={isGroupChatConst}
				/>
			)
		});
	}, [
		rid,
		tmid,
		roomType,
		roomName,
		room,
		roomUpdate,
		unreadsCount,
		roomUserId,
		joined,
		canForwardGuest,
		canReturnQueue,
		canPlaceLivechatOnHold,
		showMissingE2EEKey,
		showE2EEDisabledRoom,
		navigation,
		isMasterDetail,
		baseUrl,
		user,
		goRoomActionsView,
		toggleFollowThread,
		showActionSheet
	]);
};

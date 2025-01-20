import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { uniq } from 'lodash';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Subscription } from 'rxjs';
import UAParser from 'ua-parser-js';

import * as HeaderButton from '../../containers/HeaderButton';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { ISubscription, IUser, SubscriptionType } from '../../definitions';
import I18n from '../../i18n';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { useAppSelector } from '../../lib/hooks';
import { getRoomTitle, getUidDirectMessage, hasPermission } from '../../lib/methods/helpers';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { handleIgnore } from '../../lib/methods/helpers/handleIgnore';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import RoomInfoButtons from './components/RoomInfoButtons';
import RoomInfoViewAvatar from './components/RoomInfoViewAvatar';
import RoomInfoViewBody from './components/RoomInfoViewBody';
import RoomInfoViewTitle from './components/RoomInfoViewTitle';
import styles from './styles';
import { emitErrorCreateDirectMessage } from '../../lib/methods/helpers/emitErrorCreateDirectMessage';

type TRoomInfoViewNavigationProp = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'RoomInfoView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

type TRoomInfoViewRouteProp = RouteProp<ChatsStackParamList, 'RoomInfoView'>;

const RoomInfoView = (): React.ReactElement => {
	const {
		params: { rid, t, fromRid, member, room: roomParam, showCloseModal, itsMe }
	} = useRoute<TRoomInfoViewRouteProp>();
	const { addListener, setOptions, navigate, goBack } = useNavigation<TRoomInfoViewNavigationProp>();

	const [room, setRoom] = useState(roomParam || ({ rid, t } as ISubscription));
	const [roomFromRid, setRoomFromRid] = useState<ISubscription | undefined>();
	const [roomUser, setRoomUser] = useState(member || {});
	const [showEdit, setShowEdit] = useState(false);

	const roomType = room?.t || t;
	const isDirect = roomType === SubscriptionType.DIRECT;
	const isLivechat = roomType === SubscriptionType.OMNICHANNEL;

	const subscription = useRef<Subscription | undefined>(undefined);

	const {
		isMasterDetail,
		subscribedRoom,
		usersRoles,
		roles,
		serverVersion,
		// permissions
		editRoomPermission,
		editOmnichannelContact,
		editLivechatRoomCustomfields
	} = useAppSelector(state => ({
		subscribedRoom: state.room.subscribedRoom,
		isMasterDetail: state.app.isMasterDetail,
		roles: state.roles,
		usersRoles: state.usersRoles,
		serverVersion: state.server.version,
		// permissions
		editRoomPermission: state.permissions['edit-room'],
		editOmnichannelContact: state.permissions['edit-omnichannel-contact'],
		editLivechatRoomCustomfields: state.permissions['edit-livechat-room-customfields']
	}));

	const { colors } = useTheme();

	// Prevents from flashing RoomInfoView on the header title before fetching actual room data
	useLayoutEffect(() => {
		setHeader(false);
	});

	useEffect(() => {
		const listener = addListener('focus', () => (isLivechat ? loadVisitor() : null));
		return () => listener();
	}, []);

	useEffect(
		() => () => {
			subscription.current?.unsubscribe();
		},
		[]
	);

	useEffect(() => {
		loadRoom();
		if (isDirect) loadUser();
	}, []);

	const setHeader = (canEdit?: boolean) => {
		const HeaderRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item
					accessibilityLabel={I18n.t('Room_Info_Edit')}
					iconName='edit'
					onPress={() => {
						if (!room) return;
						logEvent(events[`RI_GO_${isLivechat ? 'LIVECHAT' : 'RI'}_EDIT`]);
						const navigationProps = { room, roomUser };
						if (isLivechat) navigate('LivechatEditView', navigationProps);
						else navigate('RoomInfoEditView', { rid, ...navigationProps });
					}}
					testID='room-info-view-edit-button'
				/>
			</HeaderButton.Container>
		);
		setOptions({
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal /> : undefined,
			title: isDirect ? I18n.t('User_Info') : I18n.t('Room_Info'),
			headerRight: canEdit ? () => <HeaderRight /> : undefined
		});
	};

	const loadVisitor = async () => {
		try {
			if (room?.visitor?._id) {
				const result = await Services.getVisitorInfo(room.visitor._id);
				if (result.success) {
					const { visitor } = result;
					const params: { os?: string; browser?: string } = {};
					if (visitor.userAgent) {
						const ua = new UAParser();
						ua.setUA(visitor.userAgent);
						params.os = `${ua.getOS().name} ${ua.getOS().version}`;
						params.browser = `${ua.getBrowser().name} ${ua.getBrowser().version}`;
					}
					setRoomUser({ ...visitor, ...params });
					setHeader();
				}
			}
		} catch (error) {
			// Do nothing
		}
	};

	const parseRoles = (roleArray: string[]) => roleArray.map(role => roles[role]);

	const handleRoles = (user: Pick<IUser, 'username' | 'roles'>) => {
		const rrr = (() => {
			const userRoles = usersRoles.find(u => u?.username === user.username);
			let r: string[] = [];
			if (userRoles?.roles?.length) r = userRoles.roles;
			if (user.roles?.length) r = [...r, ...user.roles];
			return uniq(r);
		})();
		if (rrr.length) {
			const parsedRoles = parseRoles(rrr);
			return parsedRoles;
		}
	};

	const loadUser = async () => {
		if (isEmpty(roomUser)) {
			try {
				const roomUserId = getUidDirectMessage({ ...(room || { rid, t }), itsMe });
				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					const { user } = result;
					const r = handleRoles(user);
					setRoomUser({ ...user, roles: r });
				}
			} catch {
				// do nothing
			}
		} else {
			const r = handleRoles(roomUser);
			if (r) setRoomUser({ ...roomUser, roles: r });
		}
	};

	const loadRoom = async () => {
		const permissionToEdit = isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];
		const permissions = await hasPermission(permissionToEdit, rid);
		const canEdit = permissions.some(Boolean);
		const subRoom = await getSubscriptionByRoomId(rid);
		if (!subRoom && isDirect && fromRid) {
			const roomFromRid = await getSubscriptionByRoomId(fromRid);
			if (roomFromRid?.observe) {
				const sub = roomFromRid.observe();
				subscription.current = sub.subscribe(changes => {
					setRoomFromRid(changes.asPlain());
				});
			}
		} else if (subRoom?.observe) {
			const sub = subRoom.observe();
			subscription.current = sub.subscribe(changes => {
				setRoom(changes.asPlain());
				setHeader(roomType === SubscriptionType.DIRECT ? false : canEdit);
			});
		} else {
			try {
				if (!isDirect) {
					const result = await Services.getRoomInfo(rid);
					if (result.success) setRoom({ ...room, ...(result.room as unknown as ISubscription) });
				}
			} catch (e) {
				log(e);
			}
		}
		setShowEdit(canEdit);
		setHeader(roomType === SubscriptionType.DIRECT ? false : canEdit);
	};

	const createDirect = () =>
		new Promise<void | ISubscription>(async (resolve, reject) => {
			// We don't need to create a direct
			if (!isEmpty(member)) return resolve();
			try {
				const result = await Services.createDirectMessage(roomUser.username);
				if (result.success) return resolve({ ...roomUser, rid: result.room.rid });
			} catch (e) {
				reject(e);
			}
		});

	const handleGoRoom = (r?: ISubscription) => {
		logEvent(events.RI_GO_ROOM_USER);
		const params = {
			rid: r?.rid,
			name: getRoomTitle(r),
			t: roomType,
			roomUserId: getUidDirectMessage(r)
		};

		if (r?.rid) {
			if (r.rid === subscribedRoom) {
				if (isMasterDetail) {
					return navigate('DrawerNavigator');
				}
				goBack();
				goBack();
				return;
			}
			// if it's on master detail layout, we close the modal and replace RoomView
			goRoom({ item: params, isMasterDetail, popToRoot: true });
		}
	};

	const handleCreateDirectMessage = async () => {
		try {
			let r = room;
			if (isDirect) {
				const direct = await createDirect();
				if (direct) r = direct;
			}
			handleGoRoom(r);
		} catch (e: any) {
			emitErrorCreateDirectMessage(e?.data);
		}
	};

	const handleBlockUser = async () => {
		const r = roomFromRid || room;
		const userBlocked = roomUser._id;
		const blocker = r?.blocker;
		if (!r?.rid) return;
		logEvent(events.RI_TOGGLE_BLOCK_USER);
		try {
			await Services.toggleBlockUser(r.rid, userBlocked, !blocker);
		} catch (e) {
			log(e);
		}
	};

	const handleIgnoreUser = () => {
		const r = roomFromRid || room;
		const isIgnored = r?.ignored?.includes?.(roomUser._id);
		if (r?.rid) handleIgnore(roomUser._id, !isIgnored, r?.rid);
	};

	const handleReportUser = () => {
		navigate('ReportUserView', {
			name: roomUser?.name,
			userId: roomUser?._id,
			username: roomUser.username
		});
	};

	return (
		<ScrollView style={[styles.scroll, { backgroundColor: colors.surfaceRoom }]}>
			<StatusBar />
			<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='room-info-view'>
				<View style={[styles.avatarContainer, { backgroundColor: colors.surfaceHover }]}>
					<RoomInfoViewAvatar
						username={room?.name || roomUser.username}
						rid={room?.rid}
						userId={roomUser?._id}
						handleEditAvatar={() => navigate('ChangeAvatarView', { titleHeader: I18n.t('Room_Info'), room, t, context: 'room' })}
						showEdit={showEdit}
						type={t}
					/>
					<RoomInfoViewTitle
						type={t}
						room={room || roomUser}
						name={roomUser?.name}
						username={roomUser?.username}
						statusText={roomUser?.statusText}
					/>
					<RoomInfoButtons
						rid={room?.rid || rid}
						fromRid={fromRid}
						handleBlockUser={handleBlockUser}
						handleCreateDirectMessage={handleCreateDirectMessage}
						handleIgnoreUser={handleIgnoreUser}
						handleReportUser={handleReportUser}
						isDirect={isDirect}
						room={room || roomUser}
						roomUserId={roomUser?._id}
						roomFromRid={roomFromRid}
						serverVersion={serverVersion}
						itsMe={itsMe}
					/>
				</View>
				<RoomInfoViewBody isDirect={isDirect} room={room} roomUser={roomUser} />
			</SafeAreaView>
		</ScrollView>
	);
};

export default RoomInfoView;

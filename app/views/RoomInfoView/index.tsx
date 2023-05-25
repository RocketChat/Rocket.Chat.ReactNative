import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Subscription } from 'rxjs';
import UAParser from 'ua-parser-js';

import * as HeaderButton from '../../containers/HeaderButton';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { LISTENER } from '../../containers/Toast';
import { SubscriptionType, TSubscriptionModel } from '../../definitions';
import I18n from '../../i18n';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { useAppSelector } from '../../lib/hooks';
import { getRoomTitle, getUidDirectMessage, hasPermission } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
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

type TRoomInfoViewNavigationProp = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'RoomInfoView'>,
	StackNavigationProp<MasterDetailInsideStackParamList>
>;

type TRoomInfoViewRouteProp = RouteProp<ChatsStackParamList, 'RoomInfoView'>;

const RoomInfoView = (): React.ReactElement => {
	const {
		params: { rid, t, fromRid, member, room: roomParam, showCloseModal }
	} = useRoute<TRoomInfoViewRouteProp>();
	const { addListener, setOptions, navigate, goBack } = useNavigation<TRoomInfoViewNavigationProp>();

	const [room, setRoom] = useState(roomParam);
	const [roomUser, setRoomUser] = useState(member || {});
	const [showEdit, setShowEdit] = useState(false);
	const [roomFromRid, setRoomFromRid] = useState<TSubscriptionModel | undefined>(undefined);

	const isDirect = room?.t || t === SubscriptionType.DIRECT;
	const isLivechat = room?.t || t === SubscriptionType.OMNICHANNEL;

	const subscription = useRef<Subscription | undefined>(undefined);
	const subscriptionRoomFromRid = useRef<Subscription | undefined>(undefined);

	const { editLivechatRoomCustomfields, editOmnichannelContact, editRoomPermission, isMasterDetail, roles, subscribedRoom } =
		useAppSelector(state => ({
			subscribedRoom: state.room.subscribedRoom,
			isMasterDetail: state.app.isMasterDetail,
			editRoomPermission: state.permissions['edit-room'],
			editOmnichannelContact: state.permissions['edit-omnichannel-contact'],
			editLivechatRoomCustomfields: state.permissions['edit-livechat-room-customfields'],
			roles: state.roles
		}));

	const { colors } = useTheme();

	useEffect(() => {
		const listener = addListener('focus', () => (isLivechat ? loadVisitor() : null));
		return () => listener();
	}, []);

	useEffect(
		() => () => {
			subscription.current?.unsubscribe();
			subscriptionRoomFromRid.current?.unsubscribe();
		},
		[]
	);

	useEffect(() => {
		if (isDirect) {
			loadUser();
			loadRoomFromRid();
		} else {
			loadRoom();
		}
		setHeader();
	}, []);

	const setHeader = () =>
		setOptions({
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal /> : undefined,
			title: isDirect ? I18n.t('User_Info') : I18n.t('Room_Info'),
			headerRight: showEdit
				? () => (
						<HeaderButton.Container>
							<HeaderButton.Item
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
				  )
				: undefined
		});

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

	const loadUser = async () => {
		if (isEmpty(roomUser)) {
			try {
				const roomUserId = getUidDirectMessage(room);
				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					const { user } = result;
					let parsedRoles: string[] | {} = {};
					if (user.roles?.length) {
						parsedRoles = parseRoles(user.roles);
					}
					setRoomUser({ ...user, parsedRoles });
				}
			} catch {
				// do nothing
			}
		} else if (roomUser?.roles?.length) {
			const parsedRoles = parseRoles(roomUser.roles);
			setRoomUser({ ...roomUser, parsedRoles });
		}
	};

	const loadRoomFromRid = async () => {
		try {
			if (fromRid) {
				const sub = await getSubscriptionByRoomId(fromRid);
				subscriptionRoomFromRid.current = sub?.observe().subscribe(s => setRoomFromRid(s));
			}
		} catch (e) {
			// do nothing
		}
	};

	const loadRoom = async () => {
		const subRoom = roomParam as TSubscriptionModel;
		if (subRoom?.observe) {
			const sub = subRoom.observe();
			subscription.current = sub.subscribe(changes => {
				setRoom(changes);
				setHeader();
			});
		} else {
			try {
				const result = await Services.getRoomInfo(rid);
				if (result.success) {
					// TODO: FIX ROOM TYPES
					// @ts-ignore
					setRoom({ ...room, ...result.room });
				}
			} catch (e) {
				log(e);
			}
		}

		const permissionToEdit = isLivechat ? [editOmnichannelContact, editLivechatRoomCustomfields] : [editRoomPermission];
		const permissions = await hasPermission(permissionToEdit, room?.rid);
		if (permissions.some(Boolean)) {
			setShowEdit(true);
			setHeader();
		}
	};

	const createDirect = () =>
		new Promise<void>(async (resolve, reject) => {
			// We don't need to create a direct
			if (!isEmpty(member)) {
				return resolve();
			}

			// TODO: Check if some direct with the user already exists on database
			try {
				const result = await Services.createDirectMessage(roomUser.userName);
				if (result.success && room) {
					setRoom({ ...room, rid: result.room.rid });
					return resolve();
				}
			} catch {
				reject();
			}
		});

	const handleGoRoom = () => {
		logEvent(events.RI_GO_ROOM_USER);
		const params = {
			rid: room?.rid,
			name: getRoomTitle(room),
			t: room?.t,
			roomUserId: getUidDirectMessage(room)
		};

		if (room?.rid) {
			if (room.rid === subscribedRoom) {
				if (isMasterDetail) {
					return navigate('DrawerNavigator');
				}
				return goBack();
			}
			// if it's on master detail layout, we close the modal and replace RoomView
			goRoom({ item: params, isMasterDetail, popToRoot: true });
		}
	};

	const handleCreateDirectMessage = async () => {
		try {
			if (isDirect) await createDirect();
			handleGoRoom();
		} catch {
			EventEmitter.emit(LISTENER, {
				message: I18n.t('error-action-not-allowed', { action: I18n.t('Create_Direct_Messages') })
			});
		}
	};

	const handleBlockUser = async () => {
		const rid = roomFromRid?.rid;
		const userBlocked = roomUser._id;
		const blocker = roomFromRid?.blocker;
		if (!rid) return;
		logEvent(events.RI_TOGGLE_BLOCK_USER);
		try {
			await Services.toggleBlockUser(rid, userBlocked, !!blocker);
		} catch (e) {
			log(e);
		}
	};

	const handleIgnoreUser = () => {
		const isIgnored = roomFromRid?.ignored?.includes?.(roomUser._id);
		if (roomFromRid?.rid) handleIgnore(roomUser._id, !isIgnored, roomFromRid.rid);
	};

	return (
		<ScrollView style={[styles.scroll, { backgroundColor: colors.backgroundColor }]}>
			<StatusBar />
			<SafeAreaView style={{ backgroundColor: colors.backgroundColor }} testID='room-info-view'>
				<View style={[styles.avatarContainer, { backgroundColor: colors.auxiliaryBackground }]}>
					<RoomInfoViewAvatar
						username={room?.name || roomUser.username}
						userId={roomUser._id}
						handleEditAvatar={() => navigate('ChangeAvatarView', { titleHeader: I18n.t('Room_Info'), room, t, context: 'room' })}
						showEdit={showEdit}
						type={t}
					/>
					<RoomInfoViewTitle
						room={room}
						type={t}
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
						isDirect={!!isDirect}
						roomFromRid={roomFromRid}
						roomUser={roomUser}
					/>
				</View>
				<RoomInfoViewBody isDirect={!!isDirect} room={room} roomUser={roomUser} type={t} />
			</SafeAreaView>
		</ScrollView>
	);
};

export default RoomInfoView;

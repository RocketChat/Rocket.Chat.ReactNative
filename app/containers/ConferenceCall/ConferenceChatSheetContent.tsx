import { NavigationContext, NavigationRouteContext } from '@react-navigation/native';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import I18n from '~/i18n';
import { ActionSheetProvider, useActionSheet } from '~/containers/ActionSheet';
import { type SubscriptionType } from '~/definitions';
import { createConferenceChatNavigation } from '~/lib/services/conference/conferenceChatNavigation';
import { RoomViewContent } from '~/views/RoomView/components/RoomViewContent/RoomViewContent';
import { type IRoomViewProps } from '~/views/RoomView/definitions';
import { parseRoomRoute } from '~/views/RoomView/services/parseRoomRoute';
import { createRoomStore, observeRoom } from '~/views/RoomView/stores/RoomStore';
import ConferenceMessage from './ConferenceMessage';
import ConferenceSheetHeader from './ConferenceSheetHeader';

interface IConferenceChatRoom {
	rid: string;
	t: SubscriptionType;
	name: string;
	tmid?: string;
}

interface IConferenceChatSheetContent extends IConferenceChatRoom {
	title: string;
	canRead: boolean;
}

const ROUTE_KEY = 'conference-chat';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

const ConferenceChatRoom = ({ rid, t, name, tmid }: IConferenceChatRoom): ReactElement => {
	const route = useMemo(
		() => ({ key: ROUTE_KEY, name: 'RoomView', params: { rid, t, name, tmid } }) as unknown as IRoomViewProps['route'],
		[rid, t, name, tmid]
	);
	const navigation = useMemo(() => createConferenceChatNavigation() as unknown as IRoomViewProps['navigation'], []);
	const [roomStore] = useState(() => {
		const { initialRoom, roomUserId } = parseRoomRoute(route.params);
		return createRoomStore({ rid, initialRoom, roomUserId });
	});
	const [ready, setReady] = useState(false);

	useEffect(() => observeRoom(rid, roomStore, () => setReady(true)), [rid, roomStore]);

	return (
		<ActionSheetProvider nested>
			<NavigationContext.Provider value={navigation}>
				<NavigationRouteContext.Provider value={route}>
					<RoomViewContent
						route={route}
						navigation={navigation}
						rid={rid}
						t={t}
						tmid={tmid}
						roomStore={roomStore}
						ready={ready}
					/>
				</NavigationRouteContext.Provider>
			</NavigationContext.Provider>
		</ActionSheetProvider>
	);
};

const ConferenceChatSheetContent = ({ rid, t, name, tmid, title, canRead }: IConferenceChatSheetContent): ReactElement => {
	const { hideActionSheet } = useActionSheet();

	return (
		<View style={styles.container} testID='conference-chat-sheet'>
			<ConferenceSheetHeader title={title} />
			{canRead ? (
				<ConferenceChatRoom rid={rid} t={t} name={name} tmid={tmid} />
			) : (
				<ConferenceMessage
					icon='message-disabled'
					title={I18n.t('Chat_not_shared_with_you')}
					description={I18n.t('Chat_not_shared_with_you_description')}
					actions={[{ title: I18n.t('Close'), onPress: hideActionSheet, testID: 'conference-chat-not-shared-close' }]}
				/>
			)}
		</View>
	);
};

export default ConferenceChatSheetContent;

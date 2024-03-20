import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, FlatList, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Q } from '@nozbe/watermelondb';

import * as HeaderButton from '../../../containers/HeaderButton';
import { MESSAGE_TYPE_ANY_LOAD, themes } from '../../../lib/constants';
import {
	// useTheme,
	withTheme
} from '../../../theme';
import styles from './styles';
import { IApplicationState, TMessageModel, TThreadModel } from '../../../definitions';
import PostCard from '../Components/DiscussionPostCard';
import { messageTypesToRemove } from '../data';
import { getIcon, handleStar } from '../helpers';
import RoomServices from './../../RoomView/services';
import database from '../../../lib/database';
import { compareServerVersion } from '../../../lib/methods/helpers';
import { getUserSelector } from '../../../selectors/login';

const hitSlop = { top: 10, right: 10, bottom: 10, left: 10 };
const QUERY_SIZE = 10;

type ScreenProps = {
	route: any;
};

const DiscussionView: React.FC<ScreenProps> = ({ route }) => {
	const navigation = useNavigation<StackNavigationProp<any>>();

	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const Hide_System_Messages = useSelector((state: IApplicationState) => state.settings.Hide_System_Messages as string[]);

	// const { theme } = useTheme();
	const theme = 'light';
	const [discussions, setDiscussions] = useState<TMessageModel | []>([]);
	const [title, setTitle] = useState('');
	const [loading, setLoading] = useState(true);
	const [queryCount, setQueryCount] = useState(QUERY_SIZE);
	const isFocused = useIsFocused();
	const [lastOpened, setLastOpened] = useState<Date | string>('');

	useEffect(() => {
		const room = route.params?.item;
		if (room) {
			setTitle(room.title);
			loadMessages();
		}
	}, [route.params]);

	useEffect(() => {
		if (isFocused) {
			loadMessages();
		}
	}, [isFocused]);

	useEffect(() => {
		navigation.setOptions({ title: '', headerStyle: { shadowColor: 'transparent' } });
		if (!isMasterDetail) {
			navigation.setOptions({
				headerLeft: () => (
					<TouchableOpacity
						style={{ marginLeft: 20 }}
						onPress={() => {
							navigation.goBack();
						}}
						hitSlop={hitSlop}
					>
						<Image source={getIcon('arrowLeft')} style={{ width: 11, height: 19 }} resizeMode='contain' />
					</TouchableOpacity>
				),
				headerRight: () => (
					<View style={{ marginRight: 8 }}>
						<HeaderButton.Container>
							<HeaderButton.Item
								iconName='search'
								color={themes[theme].superGray}
								onPress={() => navigation.navigate('DiscussionSearchView', { roomIDs: route?.params?.item ? [route.params.item.id] : undefined })}
							/>
						</HeaderButton.Container>
					</View>
				)
			});
		}
	});

	const loadMessages = async () => {
		const room = route.params?.item;

		if (lastOpened !== '') {
			room.lastOpen = lastOpened;
		}

		await RoomServices.getMessages(room);
		setLoading(true);

		const count = queryCount;
		let thread: TThreadModel | null = null;
		let messagesObservable;
		const { rid, sys_mes, tmid } = room;
		const showMessageInMainThread = user.showMessageInMainThread ?? false;
		const db = database.active;

		// handle servers with version < 3.0.0
		let hideSystemMessages = Array.isArray(sys_mes) ? sys_mes : Hide_System_Messages || [];
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}

		if (tmid) {
			try {
				thread = await db.get('threads').find(tmid);
			} catch (e) {
				// console.log(e);
			}
			messagesObservable = db
				.get('thread_messages')
				.query(Q.where('rid', tmid), Q.experimentalSortBy('ts', Q.desc), Q.experimentalSkip(0), Q.experimentalTake(count))
				.observe();
		} else if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(count)
			] as (Q.WhereDescription | Q.Or)[];
			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			messagesObservable = db
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		if (rid) {
			messagesObservable?.subscribe(messages => {
				if (tmid && thread) {
					messages = [...messages, thread];
				}

				/**
				 * Since 3.16.0 server version, the backend don't response with messages if
				 * hide system message is enabled
				 */
				if (compareServerVersion(serverVersion, 'lowerThan', '3.16.0') || hideSystemMessages.length) {
					messages = messages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));
				}

				// filter out messages
				messages = messages.filter(m => {
					return !(MESSAGE_TYPE_ANY_LOAD.includes(m.t) || messageTypesToRemove.includes(m.t));
				});

				const formattedMessages = messages.map(m => {
					let object = { ...m };
					try {
						if (m?._raw?.u?.length && m._raw.u.length > 0 && m._raw.u !== '[]') {
							object._raw.u = JSON.parse(m._raw.u);
						}
						if (m?._raw?.attachments?.length && m._raw.attachments.length > 0) {
							object._raw.attachments = JSON.parse(m._raw.attachments);
						}
						if (m?._raw?.replies?.length && m._raw.replies.length > 0 && m._raw.replies !== '[]') {
							object._raw.replies = JSON.parse(m._raw.replies);
						}
						if (m?._raw?.reactions?.length && m._raw.reactions.length > 0 && m._raw.reactions !== '[]') {
							object._raw.reactions = JSON.parse(m._raw.reactions);
						}
					} catch (error) {}

					return object;
				});
				setDiscussions(formattedMessages);
				setLoading(false);
			});
		}
		setLoading(false);
	};

	const handleUpdate = () => {
		loadMessages();
	};

	const renderBoards = () => {
		return (
			<FlatList
				data={discussions}
				renderItem={({ item }) => (
					<PostCard
						{...item}
						onPress={(params: any) => {
							setLastOpened(new Date())
							navigation.navigate('DiscussionPostView', { ...params, room: route.params?.item })
						}}
						starPost={(message: any) => handleStar(message, loadMessages)}
						roomId={route.params?.item}
					/>
				)}
				keyExtractor={(item, id) => item?._id + id}
				ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
				style={{ paddingHorizontal: 20, paddingTop: 10, marginBottom: 80 }}
				onEndReached={() => {
					if (discussions?.length > 9) {
						setQueryCount(queryCount + QUERY_SIZE);
						loadMessages();
					}
				}}
				showsVerticalScrollIndicator={false}
				onRefresh={() => handleUpdate()}
				refreshing={loading}
			/>
		);
	};

	return (
		<View style={styles.mainContainer}>
			<View style={styles.headerContainer}>
				<Text style={styles.headerText}>{title}</Text>
			</View>
			{discussions && renderBoards()}
			<TouchableOpacity
				style={[styles.buttonContainer, { backgroundColor: themes[theme].mossGreen }]}
				onPress={() => {
					navigation.navigate('DiscussionNewPostView', { selectedBoard: route.params?.item, boards: route.params?.boards });
				}}
			>
				<Text style={styles.buttonText}>Create a post</Text>
			</TouchableOpacity>
		</View>
	);
};

export default withTheme(DiscussionView);

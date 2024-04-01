import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, TouchableWithoutFeedback, TouchableOpacity, FlatList, Linking } from 'react-native';
import { batch, useDispatch } from 'react-redux';
import { Subscription } from 'rxjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '../../containers/List';
import Button from '../../containers/Button';
import { toggleServerDropdown } from '../../actions/rooms';
import { selectServerRequest, serverInitAdd } from '../../actions/server';
import { appStart } from '../../actions/app';
import I18n from '../../i18n';
import EventEmitter from '../../lib/methods/helpers/events';
import ServerItem from '../../containers/ServerItem';
import database from '../../lib/database';
import { TOKEN_KEY } from '../../lib/constants';
import { useTheme } from '../../theme';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { headerHeight } from '../../lib/methods/helpers/navigation';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import UserPreferences from '../../lib/methods/userPreferences';
import { RootEnum, TServerModel } from '../../definitions';
import styles from './styles';
import { removeServer } from '../../lib/methods';
import { useAppSelector } from '../../lib/hooks';

const ROW_HEIGHT = 68;
const ANIMATION_DURATION = 200;
const MAX_ROWS = 4;

const ServerDropdown = () => {
	const animatedValue = useRef(new Animated.Value(0)).current;
	const subscription = useRef<Subscription>();
	const newServerTimeout = useRef<ReturnType<typeof setTimeout> | false>();
	const isMounted = useRef(false);
	const [servers, setServers] = useState<TServerModel[]>([]);
	const dispatch = useDispatch();
	const closeServerDropdown = useAppSelector(state => state.rooms.closeServerDropdown);
	const server = useAppSelector(state => state.server.server);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (isMounted.current) close();
	}, [closeServerDropdown]);

	useEffect(() => {
		isMounted.current = true;

		const init = async () => {
			const serversDB = database.servers;
			const observable = await serversDB.get('servers').query().observeWithColumns(['name']);

			subscription.current = observable.subscribe(data => {
				setServers(data);
			});

			Animated.timing(animatedValue, {
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}).start();
		};
		init();

		return () => {
			if (newServerTimeout.current) {
				clearTimeout(newServerTimeout.current);
				newServerTimeout.current = false;
			}
			if (subscription.current && subscription.current.unsubscribe) {
				subscription.current.unsubscribe();
			}
		};
	}, []);

	const close = () => {
		Animated.timing(animatedValue, {
			toValue: 0,
			duration: ANIMATION_DURATION,
			easing: Easing.inOut(Easing.quad),
			useNativeDriver: true
		}).start(() => dispatch(toggleServerDropdown()));
	};

	const createWorkspace = async () => {
		logEvent(events.RL_CREATE_NEW_WORKSPACE);
		try {
			await Linking.openURL('https://cloud.rocket.chat/trial');
		} catch (e) {
			log(e);
		}
	};

	const navToNewServer = (previousServer: string) => {
		batch(() => {
			dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			dispatch(serverInitAdd(previousServer));
		});
	};

	const addServer = () => {
		logEvent(events.RL_ADD_SERVER);
		close();
		setTimeout(() => {
			navToNewServer(server);
		}, ANIMATION_DURATION);
	};

	const select = async (serverParam: string, version?: string) => {
		close();
		if (server !== serverParam) {
			logEvent(events.RL_CHANGE_SERVER);
			const userId = UserPreferences.getString(`${TOKEN_KEY}-${serverParam}`);
			if (isMasterDetail) {
				goRoom({ item: {}, isMasterDetail });
			}
			if (!userId) {
				setTimeout(() => {
					navToNewServer(server);
					newServerTimeout.current = setTimeout(() => {
						EventEmitter.emit('NewServer', { server: serverParam });
					}, ANIMATION_DURATION);
				}, ANIMATION_DURATION);
			} else {
				await localAuthenticate(serverParam);
				dispatch(selectServerRequest(serverParam, version, true, true));
			}
		}
	};

	const remove = (server: string) =>
		showConfirmationAlert({
			message: I18n.t('This_will_remove_all_data_from_this_server'),
			confirmationText: I18n.t('Delete'),
			onPress: async () => {
				close();
				try {
					await removeServer({ server });
				} catch {
					// do nothing
				}
			}
		});

	const renderItem = ({ item }: { item: { id: string; iconURL: string; name: string; version: string } }) => (
		<ServerItem
			item={item}
			onPress={() => select(item.id, item.version)}
			onLongPress={() => item.id === server || remove(item.id)}
			hasCheck={item.id === server}
		/>
	);

	const initialTop = 87 + Math.min(servers.length, MAX_ROWS) * ROW_HEIGHT;
	const statusBarHeight = insets?.top ?? 0;
	const heightDestination = isMasterDetail ? headerHeight + statusBarHeight : 0;

	const translateY = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [-initialTop, heightDestination]
	});

	const backdropOpacity = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0, colors.backdropOpacity]
	});

	return (
		<>
			<TouchableWithoutFeedback onPress={close}>
				<Animated.View
					style={[
						styles.backdrop,
						{
							backgroundColor: colors.backdropColor,
							opacity: backdropOpacity,
							top: heightDestination
						}
					]}
				/>
			</TouchableWithoutFeedback>
			<Animated.View
				style={[
					styles.dropdownContainer,
					{
						transform: [{ translateY }],
						backgroundColor: colors.surfaceRoom,
						borderColor: colors.strokeLight
					}
				]}
				testID='rooms-list-header-server-dropdown'
			>
				<View style={[styles.dropdownContainerHeader, styles.serverHeader, { borderColor: colors.strokeLight }]}>
					<Text style={[styles.serverHeaderText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Server')}</Text>
					<TouchableOpacity onPress={addServer} testID='rooms-list-header-server-add'>
						<Text style={[styles.serverHeaderAdd, { color: colors.badgeBackgroundLevel2 }]}>{I18n.t('Add_Server')}</Text>
					</TouchableOpacity>
				</View>
				<FlatList
					style={{ maxHeight: MAX_ROWS * ROW_HEIGHT }}
					data={servers}
					keyExtractor={item => item.id}
					renderItem={renderItem}
					ItemSeparatorComponent={List.Separator}
					keyboardShouldPersistTaps='always'
				/>
				<List.Separator />
				<Button
					title={I18n.t('Create_a_new_workspace')}
					type='secondary'
					onPress={createWorkspace}
					testID='rooms-list-header-create-workspace-button'
					style={styles.buttonCreateWorkspace}
					color={colors.badgeBackgroundLevel2}
					backgroundColor={colors.surfaceRoom}
					styleText={[styles.serverHeaderAdd, { textAlign: 'center' }]}
				/>
			</Animated.View>
		</>
	);
};

export default ServerDropdown;

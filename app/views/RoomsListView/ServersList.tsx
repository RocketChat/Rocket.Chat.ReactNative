import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Linking } from 'react-native';
import { batch, useDispatch } from 'react-redux';
import { Subscription } from 'rxjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as List from '../../containers/List';
import Button from '../../containers/Button';
import { hideActionSheetRef } from '../../containers/ActionSheet';
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
import { goRoom } from '../../lib/methods/helpers/goRoom';
import UserPreferences from '../../lib/methods/userPreferences';
import { RootEnum, TServerModel } from '../../definitions';
import styles from './styles';
import { removeServer } from '../../lib/methods';
import { useAppSelector } from '../../lib/hooks';

const ROW_HEIGHT = 68;
const MAX_ROWS = 4.5;

const ServersList = () => {
	const subscription = useRef<Subscription>();
	const [servers, setServers] = useState<TServerModel[]>([]);
	const dispatch = useDispatch();
	const server = useAppSelector(state => state.server.server);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		const init = async () => {
			const serversDB = database.servers;
			const observable = await serversDB.get('servers').query().observeWithColumns(['name']);

			subscription.current = observable.subscribe(data => {
				setServers(data);
			});
		};
		init();

		return () => {
			if (subscription.current && subscription.current.unsubscribe) {
				subscription.current.unsubscribe();
			}
		};
	}, []);

	const close = () => {
		hideActionSheetRef();
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
		navToNewServer(server);
	};

	const select = async (serverParam: string, version: string) => {
		close();
		if (server !== serverParam) {
			logEvent(events.RL_CHANGE_SERVER);
			const userId = UserPreferences.getString(`${TOKEN_KEY}-${serverParam}`);
			if (isMasterDetail) {
				goRoom({ item: {}, isMasterDetail });
			}
			if (!userId) {
				navToNewServer(server);
				// Intentionally not cleared, because it needs to trigger the emitter even after unmount
				setTimeout(() => {
					EventEmitter.emit('NewServer', { server: serverParam });
				}, 300);
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

	return (
		<View
			style={{
				backgroundColor: colors.surfaceRoom,
				borderColor: colors.strokeLight,
				marginBottom: insets.bottom
			}}
			testID='rooms-list-header-servers-list'>
			<View style={[styles.serversListContainerHeader, styles.serverHeader, { borderColor: colors.strokeLight }]}>
				<Text style={[styles.serverHeaderText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Server')}</Text>
				<TouchableOpacity onPress={addServer} testID='rooms-list-header-server-add'>
					<Text style={[styles.serverHeaderAdd, { color: colors.fontInfo }]}>{I18n.t('Add_Server')}</Text>
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
				styleText={[styles.serverHeaderAdd, { textAlign: 'center', color: colors.fontInfo }]}
			/>
		</View>
	);
};

export default ServersList;

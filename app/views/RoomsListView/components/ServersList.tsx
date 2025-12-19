import React, { memo, useEffect, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { batch, useDispatch } from 'react-redux';
import { type Subscription } from 'rxjs';

import { appStart } from '../../../actions/app';
import { selectServerRequest, serverInitAdd } from '../../../actions/server';
import { hideActionSheetRef } from '../../../containers/ActionSheet';
import Button from '../../../containers/Button';
import * as List from '../../../containers/List';
import ServerItem from '../../../containers/ServerItem';
import { RootEnum, type TServerModel } from '../../../definitions';
import I18n from '../../../i18n';
import { TOKEN_KEY } from '../../../lib/constants/keys';
import database from '../../../lib/database';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { removeServer } from '../../../lib/methods/logout';
import EventEmitter from '../../../lib/methods/helpers/events';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import { showConfirmationAlert } from '../../../lib/methods/helpers/info';
import { localAuthenticate } from '../../../lib/methods/helpers/localAuthentication';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import UserPreferences from '../../../lib/methods/userPreferences';
import { useTheme } from '../../../theme';
import styles from '../styles';

const ROW_HEIGHT = 68;
const MAX_ROWS = 4.5;

const ServersList = () => {
	'use memo';

	const subscription = useRef<Subscription | null>(null);
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
		}, 300);
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
			onDeletePress={() => item.id === server || remove(item.id)}
			hasCheck={item.id === server}
		/>
	);

	return (
		<View
			style={{
				backgroundColor: colors.surfaceLight,
				borderColor: colors.strokeLight,
				marginBottom: insets.bottom
			}}
			testID='rooms-list-header-servers-list'>
			<View style={[styles.serversListContainerHeader, styles.serverHeader, { borderColor: colors.strokeLight }]}>
				<Text style={[styles.serverHeaderText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Workspaces')}</Text>
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
			<View style={styles.addServerButtonContainer}>
				<Button
					title={I18n.t('Add_Server')}
					type='primary'
					onPress={addServer}
					testID='rooms-list-header-server-add'
					style={styles.buttonCreateWorkspace}
					color={colors.buttonFontSecondary}
					backgroundColor={colors.buttonBackgroundSecondaryDefault}
				/>
			</View>
		</View>
	);
};

export default memo(ServersList);

import React, { memo, useEffect, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { batch, useDispatch } from 'react-redux';
import { Subscription } from 'rxjs';

import { appStart } from '../../../actions/app';
import { selectServerRequest, serverInitAdd } from '../../../actions/server';
import { hideActionSheetRef } from '../../../containers/ActionSheet';
import * as List from '../../../containers/List';
import ServerItem from '../../../containers/ServerItem';
import { RootEnum } from '../../../definitions';
import I18n from '../../../i18n';
import { TOKEN_KEY } from '../../../lib/constants/keys';
import database from '../../../lib/database';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import EventEmitter from '../../../lib/methods/helpers/events';
import { goRoom } from '../../../lib/methods/helpers/goRoom';
import { localAuthenticate } from '../../../lib/methods/helpers/localAuthentication';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import UserPreferences from '../../../lib/methods/userPreferences';
import { DEFAULT_SERVER_URL } from '../../../config/appConfig';
import { useTheme } from '../../../theme';
import styles from '../styles';

const ROW_HEIGHT = 68;
const MAX_ROWS = 4.5;

const ServersList = () => {
	const subscription = useRef<Subscription | null>(null);
        const [servers, setServers] = useState<Array<{ id: string; iconURL: string; name: string; version: string }>>([]);
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
                                const mappedServers = data
                                        .map(serverModel => ({
                                                id: serverModel.id,
                                                iconURL: serverModel.iconURL,
                                                name: serverModel.name,
                                                version: serverModel.version
                                        }))
                                        .filter(serverModel => serverModel.id === DEFAULT_SERVER_URL);

                                if (mappedServers.length === 0) {
                                        mappedServers.push({
                                                id: DEFAULT_SERVER_URL,
                                                iconURL: '',
                                                name: DEFAULT_SERVER_URL,
                                                version: ''
                                        });
                                }

                                setServers(mappedServers);
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

        const renderItem = ({ item }: { item: { id: string; iconURL: string; name: string; version: string } }) => (
                <ServerItem
                        item={item}
                        onPress={() => select(item.id, item.version)}
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
			</View>
			<FlatList
				style={{ maxHeight: MAX_ROWS * ROW_HEIGHT }}
				data={servers}
				keyExtractor={item => item.id}
				renderItem={renderItem}
				ItemSeparatorComponent={List.Separator}
				keyboardShouldPersistTaps='always'
			/>
		</View>
	);
};

export default memo(ServersList);

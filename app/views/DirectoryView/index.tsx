import React, { useLayoutEffect } from 'react';
import { FlatList, type ListRenderItem } from 'react-native';
import { shallowEqual } from 'react-redux';
import { type NativeStackNavigationOptions, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type CompositeNavigationProp } from '@react-navigation/native';

import { useActionSheet } from '../../containers/ActionSheet';
import { type ChatsStackParamList } from '../../stacks/types';
import { type MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import * as List from '../../containers/List';
import DirectoryItem from '../../containers/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom as goRoomMethod, type TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { type IServerRoom, SubscriptionType } from '../../definitions';
import styles from './styles';
import Options from './Options';
import { getRoomByTypeAndName } from '../../lib/services/restApi';
import { createDirectMessage } from '../../lib/methods/createDirectMessage';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useDirectorySearch } from './hooks/useDirectorySearch';

interface IDirectoryViewProps {
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'DirectoryView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList>
	>;
}

const DirectoryView = ({ navigation }: IDirectoryViewProps): React.ReactElement => {
	const { colors } = useTheme();
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const { isFederationEnabled, directoryDefaultView, isMasterDetail } = useAppSelector(
		state => ({
			isFederationEnabled: state.settings.FEDERATION_Enabled as boolean,
			directoryDefaultView: state.settings.Accounts_Directory_DefaultView as string,
			isMasterDetail: state.app.isMasterDetail
		}),
		shallowEqual
	);

	const { data, loading, type, globalUsers, search, loadMore, onSearchChangeText, changeType, toggleWorkspace } =
		useDirectorySearch(directoryDefaultView);

	useLayoutEffect(() => {
		const showFilters = () => {
			showActionSheet({
				children: (
					<Options
						type={type}
						globalUsers={globalUsers}
						changeType={(newType: string) => {
							changeType(newType);
							hideActionSheet();
						}}
						toggleWorkspace={toggleWorkspace}
						isFederationEnabled={isFederationEnabled}
					/>
				),
				enableContentPanningGesture: false
			});
		};

		const options: NativeStackNavigationOptions = {
			title: I18n.t('Directory'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='filter' onPress={showFilters} testID='directory-view-filter' />
				</HeaderButton.Container>
			)
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}

		navigation.setOptions(options);
	}, [
		navigation,
		isMasterDetail,
		isFederationEnabled,
		type,
		globalUsers,
		changeType,
		toggleWorkspace,
		showActionSheet,
		hideActionSheet
	]);

	const goRoom = (item: TGoRoomItem) => {
		goRoomMethod({ item, isMasterDetail });
	};

	const onPressItem = async (item: IServerRoom) => {
		try {
			if (type === 'users') {
				const result = await createDirectMessage(item.username as string);
				if (result.success) {
					goRoom({ rid: result.room._id, name: item.username, t: SubscriptionType.DIRECT });
				}
				return;
			}
			const subscription = await getSubscriptionByRoomId(item._id);
			if (subscription) {
				goRoom(subscription);
				return;
			}
			if (['p', 'c'].includes(item.t) && !item.teamMain) {
				const result = await getRoomByTypeAndName(item.t, item.name || item.fname);
				if (result) {
					goRoom({
						rid: item._id,
						name: item.name,
						joinCodeRequired: result.joinCodeRequired,
						t: item.t as SubscriptionType,
						search: true
					});
				}
			} else {
				goRoom({
					rid: item._id,
					name: item.name,
					t: item.t as SubscriptionType,
					search: true,
					teamMain: item.teamMain,
					teamId: item.teamId
				});
			}
		} catch {
			// do nothing
		}
	};

	const renderItem: ListRenderItem<IServerRoom> = ({ item, index }) => {
		let style;
		if (index === data.length - 1) {
			style = {
				...sharedStyles.separatorBottom,
				borderColor: colors.strokeLight
			};
		}

		const commonProps = {
			title: item.name as string,
			onPress: () => onPressItem(item),
			testID: `directory-view-item-${item.name}`,
			style,
			rid: item._id
		};

		if (type === 'users') {
			return (
				<DirectoryItem
					avatar={item.username}
					description={item.username}
					rightLabel={item.federation && item.federation.peer}
					type='d'
					{...commonProps}
				/>
			);
		}

		if (type === 'teams') {
			return (
				<DirectoryItem
					avatar={item.name}
					description={item.name}
					rightLabel={I18n.t('N_channels', { n: item.roomsCount })}
					type={item.t}
					teamMain={item.teamMain}
					{...commonProps}
				/>
			);
		}
		return (
			<DirectoryItem
				avatar={item.name}
				description={item.topic}
				rightLabel={I18n.t('N_users', { n: item.usersCount })}
				type={item.t}
				{...commonProps}
			/>
		);
	};

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='directory-view'>
			<SearchBox onChangeText={onSearchChangeText} onSubmitEditing={search} testID='directory-view-search' />
			<List.Separator />

			<FlatList
				data={data}
				style={styles.list}
				contentContainerStyle={styles.listContainer}
				extraData={type}
				keyExtractor={item => item._id}
				renderItem={renderItem}
				ItemSeparatorComponent={List.Separator}
				keyboardShouldPersistTaps='always'
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				onEndReached={() => loadMore()}
			/>
		</SafeAreaView>
	);
};

export default DirectoryView;

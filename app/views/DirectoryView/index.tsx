import { useLayoutEffect, type ReactElement } from 'react';
import { FlatList, type ListRenderItem } from 'react-native';
import { shallowEqual } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	type NativeStackHeaderItemMenuAction,
	type NativeStackNavigationOptions,
	type NativeStackNavigationProp
} from '@react-navigation/native-stack';
import { type CompositeNavigationProp } from '@react-navigation/native';

import { useActionSheet } from '~/containers/ActionSheet';
import { type ChatsStackParamList } from '~/stacks/types';
import { type MasterDetailInsideStackParamList } from '~/stacks/MasterDetailStack/types';
import DirectoryItem from '~/containers/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '~/i18n';
import SearchBox from '~/containers/SearchBox';
import ActivityIndicator from '~/containers/ActivityIndicator';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import { useTheme } from '~/theme';
import SafeAreaView from '~/containers/SafeAreaView';
import { goRoom as goRoomMethod, type TGoRoomItem } from '~/lib/methods/helpers/goRoom';
import { type IServerRoom, SubscriptionType } from '~/definitions';
import styles from './styles';
import Options from './Options';
import { getRoomByTypeAndName } from '~/lib/services/restApi';
import { createDirectMessage } from '~/lib/methods/createDirectMessage';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useDirectorySearch } from './hooks/useDirectorySearch';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { headerIcon } from '~/lib/methods/helpers/navigation/headerIcon';
import RowSeparator from '~/containers/NativeListRow/Separator';
import { useListBackgroundColor } from '~/containers/NativeListRow/useListBackgroundColor';

interface IDirectoryViewProps {
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'DirectoryView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList>
	>;
}

const DirectoryView = ({ navigation }: IDirectoryViewProps): ReactElement => {
	const { colors } = useTheme();
	const listBackgroundColor = useListBackgroundColor(colors.surfaceRoom);
	const { bottom } = useSafeAreaInsets();
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const { isFederationEnabled, directoryDefaultView } = useAppSelector(
		state => ({
			isFederationEnabled: state.settings.FEDERATION_Enabled as boolean,
			directoryDefaultView: state.settings.Accounts_Directory_DefaultView as string
		}),
		shallowEqual
	);
	const isMasterDetail = useMasterDetail();

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

		const typeAction = (
			itemType: string,
			title: string,
			icon: NativeStackHeaderItemMenuAction['icon']
		): NativeStackHeaderItemMenuAction => ({
			type: 'action',
			label: I18n.t(title),
			icon,
			state: type === itemType ? 'on' : 'off',
			onPress: () => changeType(itemType)
		});

		const options: NativeStackNavigationOptions = hasNativeHeaderBar
			? {
					title: I18n.t('Directory'),
					headerRight: undefined,
					headerTransparent: true,
					headerSearchBarOptions: {
						placement: 'stacked',
						placeholder: I18n.t('Search'),
						onChangeText: event => onSearchChangeText(event.nativeEvent.text),
						onSearchButtonPress: () => search(),
						onCancelButtonPress: () => onSearchChangeText('')
					},
					unstable_headerRightItems: () => [
						{
							type: 'menu',
							label: I18n.t('Filter'),
							accessibilityLabel: I18n.t('Filter'),
							icon: headerIcon('filter'),
							menu: {
								items: [
									{
										type: 'submenu',
										label: I18n.t('Filter'),
										inline: true,
										items: [
											typeAction('channels', 'Channels', { type: 'sfSymbol', name: 'number' }),
											typeAction('users', 'Users', { type: 'sfSymbol', name: 'person' }),
											typeAction('teams', 'Teams', { type: 'sfSymbol', name: 'person.3' })
										]
									},
									...(isFederationEnabled
										? [
												{
													type: 'action' as const,
													label: I18n.t('Search_global_users'),
													description: I18n.t('Search_global_users_description'),
													state: globalUsers ? ('on' as const) : ('off' as const),
													onPress: toggleWorkspace
												}
											]
										: [])
								]
							}
						}
					]
				}
			: {
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
		hideActionSheet,
		onSearchChangeText,
		search
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
			rid: item._id,
			isFirst: index === 0,
			isLast: index === data.length - 1
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
		<SafeAreaView style={{ backgroundColor: listBackgroundColor }} testID='directory-view'>
			{hasNativeHeaderBar ? null : (
				<SearchBox onChangeText={onSearchChangeText} onSubmitEditing={search} testID='directory-view-search' />
			)}

			<FlatList
				data={data}
				contentInsetAdjustmentBehavior={hasNativeHeaderBar ? 'automatic' : undefined}
				style={styles.list}
				contentContainerStyle={[styles.listContainer, { paddingBottom: bottom }]}
				extraData={type}
				keyExtractor={item => item._id}
				renderItem={renderItem}
				ItemSeparatorComponent={RowSeparator}
				keyboardShouldPersistTaps='always'
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				onEndReached={() => loadMore()}
			/>
		</SafeAreaView>
	);
};

export default DirectoryView;

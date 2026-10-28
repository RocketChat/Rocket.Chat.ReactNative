import { useLayoutEffect, useRef } from 'react';
import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type SearchBarCommands } from 'react-native-screens';

import RoomHeader from '~/containers/RoomHeader';
import { type TSubscriptionModel } from '~/definitions';
import I18n from '~/i18n';
import { useAppNavigation } from '~/lib/hooks/navigation';
import { useTeamChannelPermissions } from '~/lib/hooks/useTeamChannelPermissions';
import { getRoomTitle, hasNativeHeaderBar } from '~/lib/methods/helpers';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { translucentHeader } from '~/lib/methods/helpers/navigation';
import { type IHeaderAction } from '~/lib/methods/helpers/navigation/headerActions';
import { searchHeaderOptions } from '~/lib/methods/helpers/navigation/searchHeaderOptions';
import { type ChatsStackParamList } from '~/stacks/types';

interface IUseTeamChannelsHeader {
	team: TSubscriptionModel | null;
	teamId: string;
	joined: boolean;
	isSearching: boolean;
	startSearch: () => void;
	cancelSearch: () => void;
	onSearchChangeText: (text: string) => void;
}

export const useTeamChannelsHeader = ({
	team,
	teamId,
	joined,
	isSearching,
	startSearch,
	cancelSearch,
	onSearchChangeText
}: IUseTeamChannelsHeader) => {
	const navigation = useAppNavigation<ChatsStackParamList, 'TeamChannelsView'>();
	const searchBarRef = useRef<SearchBarCommands>(null);
	const { canCreateNew, canAddExisting } = useTeamChannelPermissions(team?.rid, team?.t);
	const canCreate = canCreateNew || canAddExisting;
	const isSearchHeaderActive = !hasNativeHeaderBar && isSearching;

	useLayoutEffect(() => {
		const goRoomActionsView = () => {
			if (!team) {
				return;
			}
			logEvent(events.TC_GO_ACTIONS);
			navigation.navigate('RoomActionsView', { rid: team.rid, t: team.t, room: team, joined });
		};

		const rightActions: IHeaderAction[] =
			team && canCreate
				? [
						{
							label: I18n.t('Add_Channel_to_Team'),
							icon: 'create',
							testID: 'team-channels-view-create',
							onPress: () => navigation.navigate('AddChannelTeamView', { teamId, rid: team.rid, t: team.t as 'c' | 'p' })
						}
					]
				: [];

		const title = team ? getRoomTitle(team) : '';
		const titleOptions: NativeStackNavigationOptions = hasNativeHeaderBar
			? {
					...translucentHeader,
					headerTitle: title,
					headerSubtitle: team?.topic,
					onHeaderTitlePress: goRoomActionsView
				}
			: {
					headerTitle: () => (
						<RoomHeader title={title} subtitle={team?.topic} type={team?.t ?? ''} onPress={goRoomActionsView} teamMain />
					)
				};

		navigation.setOptions(
			searchHeaderOptions({
				isSearching: isSearchHeaderActive,
				searchBarRef,
				onSearchPress: startSearch,
				onChangeText: onSearchChangeText,
				onCancel: cancelSearch,
				testIDPrefix: 'team-channels-view',
				options: { headerLeft: undefined, ...titleOptions },
				rightActions
			})
		);
	}, [team, teamId, joined, isSearchHeaderActive, canCreate, navigation, startSearch, cancelSearch, onSearchChangeText]);
};

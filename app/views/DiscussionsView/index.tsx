import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { RouteProp } from '@react-navigation/core';

import { IMessageFromServer } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../lib/methods/helpers/log';
import { debounce, isIOS } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { getHeaderTitlePosition } from '../../containers/Header';
import { useTheme } from '../../theme';
import SearchHeader from '../../containers/SearchHeader';
import { TThreadModel } from '../../definitions/IThread';
import Item from './Item';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';

const API_FETCH_COUNT = 50;

const styles = StyleSheet.create({
	contentContainer: {
		marginBottom: 30
	}
});

interface IDiscussionsViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'DiscussionsView'>;
	route: RouteProp<ChatsStackParamList, 'DiscussionsView'>;
	item: TThreadModel;
}

const DiscussionsView = ({ navigation, route }: IDiscussionsViewProps): React.ReactElement => {
	const rid = route.params?.rid;
	const t = route.params?.t;

	const baseUrl = useAppSelector(state => state.server?.server);
	const isMasterDetail = useAppSelector(state => state.app?.isMasterDetail);

	const [loading, setLoading] = useState(false);
	const [discussions, setDiscussions] = useState<IMessageFromServer[]>([]);
	const [search, setSearch] = useState<IMessageFromServer[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [total, setTotal] = useState(0);
	const [searchTotal, setSearchTotal] = useState(0);

	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	const load = async (text = '') => {
		if (loading) {
			return;
		}

		setLoading(true);
		try {
			const result = await Services.getDiscussions({
				roomId: rid,
				offset: isSearching ? search.length : discussions.length,
				count: API_FETCH_COUNT,
				text
			});

			if (result.success) {
				if (isSearching) {
					setSearch(result.messages);
					setSearchTotal(result.total);
				} else {
					setDiscussions(result.messages);
					setTotal(result.total);
				}
			}
			setLoading(false);
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	const onSearchChangeText = debounce(async (text: string) => {
		setIsSearching(true);
		await load(text);
	}, 300);

	const onCancelSearchPress = () => {
		setIsSearching(false);
		setSearch([]);
		setSearchTotal(0);
	};

	const onSearchPress = () => {
		setIsSearching(true);
	};

	const setHeader = () => {
		let options: Partial<StackNavigationOptions>;
		if (isSearching) {
			const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 1 });
			options = {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => (
					<SearchHeader onSearchChangeText={onSearchChangeText} testID='discussion-messages-view-search-header' />
				),
				headerTitleContainerStyle: {
					left: headerTitlePosition.left,
					right: headerTitlePosition.right
				},
				headerRight: () => null
			};
			return options;
		}

		options = {
			headerLeft: () => (
				<HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={colors.headerTintColor} />
			),
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Discussions'),
			headerTitleContainerStyle: {
				left: 0,
				right: 0
			},
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='search' onPress={onSearchPress} />
				</HeaderButton.Container>
			)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}
		return options;
	};

	useEffect(() => {
		load();
	}, []);

	useLayoutEffect(() => {
		const options = setHeader();
		navigation.setOptions(options);
	}, [navigation, isSearching]);

	const onDiscussionPress = debounce(
		(item: TThreadModel) => {
			if (item.drid && item.t) {
				navigation.push('RoomView', {
					rid: item.drid,
					prid: item.rid,
					name: item.msg,
					t
				});
			}
		},
		1000,
		true
	);

	const renderItem = ({ item }: { item: IMessageFromServer }) => (
		<Item
			{...{
				item,
				baseUrl
			}}
			onPress={onDiscussionPress}
		/>
	);

	if (!discussions?.length) {
		return <BackgroundContainer loading={loading} text={I18n.t('No_discussions')} />;
	}

	return (
		<SafeAreaView testID='discussions-view'>
			<StatusBar />
			<FlatList
				data={isSearching ? search : discussions}
				renderItem={renderItem}
				keyExtractor={(item: any) => item.msg}
				style={{ backgroundColor: colors.backgroundColor }}
				contentContainerStyle={styles.contentContainer}
				onEndReachedThreshold={0.5}
				removeClippedSubviews={isIOS}
				onEndReached={() => (isSearching ? searchTotal : total) > API_FETCH_COUNT ?? load()}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				scrollIndicatorInsets={{ right: 1 }}
			/>
		</SafeAreaView>
	);
};

export default DiscussionsView;

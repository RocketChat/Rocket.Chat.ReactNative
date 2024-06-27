import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/core';

import { IMessageFromServer, TThreadModel } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../lib/methods/helpers/log';
import { isIOS, useDebounce } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { useTheme } from '../../theme';
import SearchHeader from '../../containers/SearchHeader';
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
	navigation: NativeStackNavigationProp<ChatsStackParamList, 'DiscussionsView'>;
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
	const total = useRef(0);
	const searchText = useRef('');
	const offset = useRef(0);

	const { colors } = useTheme();

	const load = async () => {
		if (loading) {
			return;
		}

		setLoading(true);
		try {
			const result = await Services.getDiscussions({
				roomId: rid,
				offset: offset.current,
				count: API_FETCH_COUNT,
				text: searchText.current
			});

			if (result.success) {
				offset.current += result.count;
				total.current = result.total;
				if (isSearching) {
					setSearch(prevState => (offset.current ? [...prevState, ...result.messages] : result.messages));
				} else {
					setDiscussions(result.messages);
				}
			}
			setLoading(false);
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	const onSearchChangeText = useDebounce((text: string) => {
		setIsSearching(true);
		setSearch([]);
		searchText.current = text;
		offset.current = 0;
		load();
	}, 500);

	const onCancelSearchPress = () => {
		setIsSearching(false);
		setSearch([]);
		searchText.current = '';
		offset.current = 0;
	};

	const onSearchPress = () => {
		setIsSearching(true);
	};

	const setHeader = () => {
		let options: Partial<NativeStackNavigationOptions>;
		if (isSearching) {
			options = {
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => (
					<SearchHeader onSearchChangeText={onSearchChangeText} testID='discussion-messages-view-search-header' />
				),
				headerRight: () => null
			};
			return options;
		}

		options = {
			headerLeft: () => null,
			headerTitle: I18n.t('Discussions'),
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

	const onDiscussionPress = (item: TThreadModel) => {
		if (item.drid && item.t) {
			navigation.push('RoomView', {
				rid: item.drid,
				prid: item.rid,
				name: item.msg,
				t
			});
		}
	};

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
				keyExtractor={(item: any) => item._id}
				style={{ backgroundColor: colors.surfaceRoom }}
				contentContainerStyle={styles.contentContainer}
				onEndReachedThreshold={0.5}
				removeClippedSubviews={isIOS}
				onEndReached={() => isSearching && offset.current < total.current && load()}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				scrollIndicatorInsets={{ right: 1 }}
			/>
		</SafeAreaView>
	);
};

export default DiscussionsView;

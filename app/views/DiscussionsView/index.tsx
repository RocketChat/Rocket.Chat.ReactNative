import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton, StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';

import { SubscriptionType } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../utils/log';
import debounce from '../../utils/debounce';
import { themes } from '../../constants/colors';
import SafeAreaView from '../../containers/SafeAreaView';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { isIOS } from '../../utils/deviceInfo';
import { getHeaderTitlePosition } from '../../containers/Header';
import { useTheme } from '../../theme';
import RocketChat from '../../lib/rocketchat';
import SearchHeader from '../../containers/SearchHeader';
import { TThreadModel } from '../../definitions/IThread';
import Item from './Item';
import styles from './styles';

const API_FETCH_COUNT = 50;

interface IDiscussionsViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'DiscussionsView'>;
	route: RouteProp<ChatsStackParamList, 'DiscussionsView'>;
	item: TThreadModel;
}

interface IDiscussionsViewState {
	login: {
		user: {
			id: string;
			token: string;
		};
	};
	server: {
		server: string;
	};
	settings: {
		UI_Use_Real_Name: boolean;
		Message_TimeFormat: string;
	};
	app: {
		isMasterDetail: boolean;
	};
}

const DiscussionsView = ({ navigation, route }: IDiscussionsViewProps): JSX.Element => {
	const rid = route.params?.rid;

	const user = useSelector((state: IDiscussionsViewState) => state.login?.user);
	const baseUrl = useSelector((state: IDiscussionsViewState) => state.server?.server);
	const isMasterDetail = useSelector((state: IDiscussionsViewState) => state.app?.isMasterDetail);

	const [loading, setLoading] = useState(false);
	const [discussions, setDiscussions] = useState([]);
	const [search, setSearch] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [total, setTotal] = useState(0);
	const [searchTotal, setSearchTotal] = useState(0);

	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const load = async (text = '') => {
		if (loading) {
			return;
		}

		setLoading(true);
		try {
			const result = await RocketChat.getDiscussions({
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
					<SearchHeader
						placeholder='Search Messages'
						onSearchChangeText={onSearchChangeText}
						theme={theme}
						testID='discussion-messages-view-search-header'
					/>
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
				<HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={themes[theme!].headerTintColor} />
			),
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Discussions'),
			headerTitleContainerStyle: {
				left: null,
				right: null
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

	useEffect(() => {
		const options = setHeader();
		navigation.setOptions(options);
	}, [navigation, isSearching]);

	const onDiscussionPress = debounce(
		(item: TThreadModel) => {
			navigation.push('RoomView', {
				rid: item.drid!,
				prid: item.rid,
				name: item.msg,
				t: item.rid! === 'GENERAL' ? SubscriptionType.CHANNEL : SubscriptionType.GROUP
			});
		},
		1000,
		true
	);

	const renderItem = ({ item }: { item: TThreadModel }) => (
		<Item
			{...{
				item,
				user,
				navigation,
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
				style={{ backgroundColor: themes[theme!].backgroundColor }}
				contentContainerStyle={styles.contentContainer}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				removeClippedSubviews={isIOS}
				onEndReached={() => (searchTotal || total) > API_FETCH_COUNT ?? load()}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				scrollIndicatorInsets={{ right: 1 }}
			/>
		</SafeAreaView>
	);
};

export default DiscussionsView;

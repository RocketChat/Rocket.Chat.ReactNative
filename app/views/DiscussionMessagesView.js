/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/stack';

import ActivityIndicator from '../containers/ActivityIndicator';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import log from '../utils/log';
import debounce from '../utils/debounce';
import { themes } from '../constants/colors';
import SafeAreaView from '../containers/SafeAreaView';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import BackgroundContainer from '../containers/BackgroundContainer';
import { isIOS } from '../utils/deviceInfo';
import { getHeaderTitlePosition } from '../containers/Header';
import SearchHeader from './ThreadMessagesView/SearchHeader';
import { useTheme } from '../theme';
import Message from '../containers/message';
import RocketChat from '../lib/rocketchat';

const API_FETCH_COUNT = 25;

const DiscussionMessagesView = ({ navigation, route }) => {
	const rid = route.params?.rid;
	const canAutoTranslate = route.params?.canAutoTranslate;
	const autoTranslate = route.params?.autoTranslate;
	const autoTranslateLanguage = route.params?.autoTranslateLanguage;
	const navToRoomInfo = route.params?.navToRoomInfo;
	const user = useSelector(state => state.login?.user);
	const baseUrl = useSelector(state => state.server.server);
	const useRealName = useSelector(state => state.settings.UI_Use_Real_Name);
	const Message_TimeFormat = useSelector(state => state.settings.Message_TimeFormat);
	const isMasterDetail = useSelector(state => state.app.isMasterDetail);
	const [loading, setLoading] = useState(false);
	const [discussions, setDiscussions] = useState([]);
	const [search, setSearch] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const load = async() => {
		if (loading) {
			return;
		}

		setLoading(true);
		try {
			const result = await RocketChat.getDiscussions({
				roomId: rid,
				offset: discussions.length,
				count: API_FETCH_COUNT
			});

			if (result.success) {
				if (isSearching) {
					setSearch(result.messages);
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

	const onSearchChangeText = debounce(async(text) => {
		setLoading(true);
		try {
			const result = await RocketChat.getDiscussions({
				roomId: rid,
				offset: search.length,
				count: API_FETCH_COUNT,
				text
			});
			if (result.success) {
				setSearch(result.messages);
			}
			setLoading(false);
		} catch (e) {
			log(e);
			setLoading(false);
		}
	}, 300);

	const onCancelSearchPress = () => {
		setIsSearching(false);
		load();
	};

	const onSearchPress = () => {
		setIsSearching(true);
	};

	const setHeader = () => {
		if (isSearching) {
			const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 1 });
			return {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item
							iconName='close'
							onPress={onCancelSearchPress}
						/>
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader placeholder='Search Messages' onSearchChangeText={onSearchChangeText} />,
				headerTitleContainerStyle: {
					left: headerTitlePosition.left,
					right: headerTitlePosition.right
				},
				headerRight: () => null
			};
		}

		const options = {
			headerLeft: () => (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.pop()}
					tintColor={themes[theme].headerTintColor}
				/>
			),
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Discussions'),
			headerTitleContainerStyle: {
				left: null,
				right: null
			}
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item iconName='search' onPress={onSearchPress} />
			</HeaderButton.Container>
		);
		return options;
	};

	useEffect(() => {
		load();
	}, []);

	useEffect(() => {
		const options = setHeader();
		navigation.setOptions(options);
	}, [navigation, isSearching]);


	const onDiscussionPress = debounce((item) => {
		navigation.push('RoomView', {
			rid: item.drid, prid: item.rid, name: item.msg, t: 'p'
		});
	}, 1000, true);

	const renderItem = ({ item }) => (
		<Message
			item={item}
			user={user}
			rid={rid}
			navToRoomInfo={navToRoomInfo}
			onDiscussionPress={onDiscussionPress}
			baseUrl={baseUrl}
			timeFormat={Message_TimeFormat}
			useRealName={useRealName}
			autoTranslateRoom={canAutoTranslate && autoTranslate}
			autoTranslateLanguage={autoTranslateLanguage}
		/>
	);
	if (!discussions?.length) {
		return (
			<>
				<BackgroundContainer text={I18n.t('No_discussions')} />
			</>
		);
	}

	return (
		<SafeAreaView testID='discussion-messages-view'>
			<StatusBar />
			<FlatList
				data={isSearching ? search : discussions}
				renderItem={renderItem}
				keyExtractor={item => item.msg}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				removeClippedSubviews={isIOS}
				onEndReached={() => discussions.length > 25 ?? load()}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				scrollIndicatorInsets={{ right: 1 }}
			/>
		</SafeAreaView>
	);
};

DiscussionMessagesView.propTypes = {
	navigation: PropTypes.object,
	route: PropTypes.object
};

export default DiscussionMessagesView;

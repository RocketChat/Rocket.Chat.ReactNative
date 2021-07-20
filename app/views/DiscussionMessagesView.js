import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/stack';

import Item from './ThreadMessagesView/Item';
import ActivityIndicator from '../containers/ActivityIndicator';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import StatusBar from '../containers/StatusBar';
import log from '../utils/log';
import debounce from '../utils/debounce';
import { themes } from '../constants/colors';
import { getUserSelector } from '../selectors/login';
import SafeAreaView from '../containers/SafeAreaView';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import BackgroundContainer from '../containers/BackgroundContainer';
import { isIOS } from '../utils/deviceInfo';
import { makeThreadName } from '../utils/room';
import { getHeaderTitlePosition } from '../containers/Header';
import SearchHeader from './ThreadMessagesView/SearchHeader';
import { useTheme } from '../theme';

const DiscussionMessagesView = ({ navigation, route }) => {
	const mounted = useRef();
	const rid = route.params?.rid;
	const t = route.params?.t;
	const prid = route.params?.prid;
	const baseUrl = useSelector(state => state.server.server);
	const user = useSelector(state => getUserSelector(state));
	const useRealName = useSelector(state => state.settings.UI_Use_Real_Name);
	const isMasterDetail = useSelector(state => state.app.isMasterDetail);
	const [loading, setLoading] = useState(false);
	const [discussions, setDiscussions] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	// const [searchText, setSearchText] = useState('');
	const theme = useTheme();
	const insets = useSafeAreaInsets();

	const load = debounce(async() => {
		if (loading || !mounted) {
			return;
		}

		setLoading(true);

		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const discussionsMessages = await subCollection.query(
				Q.where('rid', Q.eq(rid)),
				Q.where('prid', Q.eq(prid))
			);
			setDiscussions(discussionsMessages);
			setLoading(false);
		} catch (e) {
			log(e);
		}
	}, 300);

	// const onSearchChangeText = debounce((text) => {
	// 	setSearchText(text);
	// }, 300);

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
							onPress={this.onCancelSearchPress}
						/>
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={this.onSearchChangeText} />,
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
			headerTitle: I18n.t('Discussion'),
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

	// const onCancelSearchPress = () => {
	// 	setIsSearching(false);
	// 	setSearchText('');
	// 	setHeader();
	// };

	useEffect(() => {
		if (!mounted.current) {
			load();
			mounted.current = true;
		} else {
			setHeader();
		}
	}, []);


	const onThreadPress = debounce((item) => {
		if (isMasterDetail) {
			navigation.pop();
		}
		navigation.push('RoomView', {
			rid: item.subscription.id,
			name: makeThreadName(item),
			t,
			roomUserId: RocketChat.getUidDirectMessage(item)
		});
	}, 1000, true);

	const getBadgeColor = item => getBadgeColor({ item, theme, messageId: item?.id });

	// eslint-disable-next-line react/prop-types
	const renderItem = ({ item }) => {
		const badgeColor = getBadgeColor(item);
		return (
			<Item
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...{
					item,
					user,
					navigation,
					baseUrl,
					useRealName,
					badgeColor
				}}
				onPress={onThreadPress}
			/>
		);
	};

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
				data={discussions}
				renderItem={renderItem}
				// style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				// contentContainerStyle={styles.contentContainer}
				onEndReached={load}
				onEndReachedThreshold={0.5}
				maxToRenderPerBatch={5}
				windowSize={10}
				initialNumToRender={7}
				removeClippedSubviews={isIOS}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				scrollIndicatorInsets={{ right: 1 }} // https://github.com/facebook/react-native/issues/26610#issuecomment-539843444
			/>
		</SafeAreaView>
	);
};

DiscussionMessagesView.propTypes = {
	navigation: PropTypes.object,
	route: PropTypes.object
};

export default DiscussionMessagesView;

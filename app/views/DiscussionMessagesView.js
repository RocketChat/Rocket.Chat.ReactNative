import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/stack';

import ActivityIndicator from '../containers/ActivityIndicator';
import I18n from '../i18n';
import database from '../lib/database';
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

const DiscussionMessagesView = ({ navigation, route }) => {
	const rid = route.params?.rid;
	// const t = route.params?.t;
	// const prid = route.params?.prid;
	const canAutoTranslate = route.params?.canAutoTranslate;
	const autoTranslate = route.params?.autoTranslate;
	const autoTranslateLanguage = route.params?.autoTranslateLanguage;
	const baseUrl = useSelector(state => state.server.server);
	// const user = useSelector(state => getUserSelector(state));
	const useRealName = useSelector(state => state.settings.UI_Use_Real_Name);
	const Message_TimeFormat = useSelector(state => state.settings.Message_TimeFormat);
	const isMasterDetail = useSelector(state => state.app.isMasterDetail);
	const [loading, setLoading] = useState(false);
	const [discussions, setDiscussions] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchText, setSearchText] = useState('');
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	const load = async() => {
		if (loading) {
			return;
		}

		setLoading(true);

		try {
			const db = database.active;
			const subCollection = db.get('messages');
			const subDiscussions = await subCollection.query(
				Q.where('rid', Q.eq(rid)),
				Q.where('drid', Q.notEq(null))
			);
			setDiscussions(subDiscussions);
			setLoading(false);
		} catch (e) {
			log(e);
		}
	};

	const onSearchChangeText = debounce((text) => {
		setSearchText(text);
	}, 300);

	const onCancelSearchPress = () => {
		setIsSearching(false);
		setSearchText('');
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
				headerTitle: () => <SearchHeader onSearchChangeText={onSearchChangeText} />,
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
		const options = setHeader();
		navigation.setOptions(options);
	}, []);


	const onDiscussionPress = debounce((item) => {
		navigation.push('RoomView', {
			rid: item.drid, prid: item.rid, name: item.msg, t: 'p'
		});
	}, 1000, true);

	// eslint-disable-next-line react/prop-types
	const renderItem = ({ item }) => (
		<Message
			item={item}
			// eslint-disable-next-line react/prop-types
			user={item.id}
			rid={rid}
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
				data={discussions}
				renderItem={renderItem}
				// style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				// contentContainerStyle={styles.contentContainer}
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

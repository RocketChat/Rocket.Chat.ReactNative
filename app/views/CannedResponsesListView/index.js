import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import I18n from '../../i18n';

import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import HeaderCanned from './HeaderCanned';
import CannedResponseItem from './CannedResponseItem';
import RocketChat from '../../lib/rocketchat';
import debounce from '../../utils/debounce';

const COUNT = 25;

const CannedResponsesListView = (props) => {
	const [cannedResponses, setCannedResponses] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [loading, setLoading] = useState(false);
	const [offset, setOffset] = useState(0);
	const { theme } = useTheme();

	useEffect(() => {
		const { navigation } = props;
		navigation.setOptions({
			title: I18n.t('Canned_Responses')
		});
	}, []);

	const getListCannedResponse = async(text = '', debounced) => {
		try {
			const res = await RocketChat.getListCannedResponse({
				text,
				offset,
				count: COUNT
			});
			if (res.success) {
				setCannedResponses(prevCanned => (
					debounced
						? res.cannedResponses
						: [...prevCanned, ...res.cannedResponses]
				));
				setLoading(false);
				setOffset(prevOffset => prevOffset + COUNT);
			}
		} catch (e) {
			// do nothing
		}
	};

	const searchCallback = useCallback(debounce(async(text) => {
		await getListCannedResponse(text, true);
	}, 1000), []); // use debounce with useCallback https://stackoverflow.com/a/58594890

	useEffect(() => {
		getListCannedResponse();
	}, []);

	const search = (text) => {
		setCannedResponses([]);
		setLoading(true);
		setOffset(0);
		setSearchText(text);
		searchCallback(text);
	};

	const onEndReached = async() => {
		if (cannedResponses.length < offset || loading) {
			return;
		}
		setLoading(true);
		await getListCannedResponse(searchText);
	};

	return (
		<SafeAreaView>
			<StatusBar />

			<HeaderCanned theme={theme} onChangeText={search} />
			<FlatList
				data={cannedResponses}
				extraData={cannedResponses}
				renderItem={({ item }) => (
					<CannedResponseItem
						theme={theme}
						scope={item.scope}
						shortcut={item.shortcut}
						tags={item?.tags}
						text={item.text}
						onPressDetail={() => console.log('🏎️', cannedResponses, offset)}
					/>
				)}
				keyExtractor={item => item._id || item.shortcut}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
			/>

		</SafeAreaView>
	);
};

CannedResponsesListView.propTypes = {
	navigation: PropTypes.object
};

export default CannedResponsesListView;

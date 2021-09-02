import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import I18n from '../../i18n';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import HeaderCanned from './HeaderCanned';
import CannedResponseItem from './CannedResponseItem';
import RocketChat from '../../lib/rocketchat';

const CannedResponsesListView = (props) => {
	const [cannedResponses, setCannedResponses] = useState([]);
	const { theme } = useTheme();

	useEffect(() => {
		const { navigation } = props;
		navigation.setOptions({
			title: I18n.t('Canned_Responses')

		});
	}, []);

	const getListCannedResponse = async() => {
		try {
			const res = await RocketChat.getListCannedResponse({
				offset: 0, count: 80, scope: 'department', departmentId: 'qajzu7WaBRoQBpq6Z'
			});
			if (res.success) {
				setCannedResponses(res.cannedResponses);
			}
			console.log('🚀 ~ file: index.js ~ line 29 ~ getListCannedResponse ~ res', res);
		} catch (e) {
			console.log('🚀 ~ file: index.js ~ line 32 ~ getListCannedResponse ~ e', e);
		}
	};

	useEffect(() => {
		getListCannedResponse();
	}, []);

	return (
		<SafeAreaView>
			<StatusBar />

			<HeaderCanned theme={theme} />
			<FlatList
				data={cannedResponses}
				extraData={cannedResponses}
				renderItem={({ item }) => (
					<>
						<CannedResponseItem
							theme={theme}
							scope={item.scope}
							shortcut={item.shortcut}
							tags={item?.tags}
							text={item.text}
						/>
						<List.Separator />
					</>
				)}
				keyExtractor={item => item._id || item.shortcut}
			/>

		</SafeAreaView>
	);
};

CannedResponsesListView.propTypes = {
	navigation: PropTypes.object
};

export default CannedResponsesListView;

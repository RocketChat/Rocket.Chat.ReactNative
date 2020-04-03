import React, { useEffect, useState } from 'react';
import { Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../theme';
import RocketChat from '../lib/rocketchat';
import { themes } from '../constants/colors';
import Separator from '../containers/Separator';
import openLink from '../utils/openLink';
import I18n from '../i18n';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';

const Item = ({ item }) => (
	<Text onPress={() => openLink(item.navigation.page.location.href)}>{item.navigation.page.title || I18n.t('Empty_title')}</Text>
);
Item.propTypes = {
	item: PropTypes.object
};

const VisitorNavigationView = ({ navigation, theme }) => {
	let offset;
	let total = 0;
	const [pages, setPages] = useState([]);

	const getPages = async() => {
		const rid = navigation.getParam('rid');
		if (rid) {
			try {
				const result = await RocketChat.getPagesLivechat(rid, offset);
				if (result.success) {
					setPages(result.pages);
					offset = result.pages.length;
					({ total } = result);
				}
			} catch {
				// do nothig
			}
		}
	};

	useEffect(() => { getPages(); }, []);

	const onEndReached = debounce(() => {
		if (pages.length <= total) {
			getPages();
		}
	}, 300);

	return (
		<FlatList
			data={pages}
			renderItem={Item}
			ItemSeparatorComponent={() => <Separator theme={theme} />}
			contentContainerStyle={[
				sharedStyles.separatorBottom,
				{
					backgroundColor: themes[theme].backgroundColor,
					borderColor: themes[theme].separatorColor
				}
			]}
			style={{ backgroundColor: themes[theme].backgroundColor }}
			onEndReached={onEndReached}
			onEndReachedThreshold={5}
		/>
	);
};
VisitorNavigationView.propTypes = {
	theme: PropTypes.string,
	navigation: PropTypes.object
};

export default withTheme(VisitorNavigationView);

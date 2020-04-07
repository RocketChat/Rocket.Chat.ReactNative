import React, { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../theme';
import RocketChat from '../lib/rocketchat';
import { themes } from '../constants/colors';
import Separator from '../containers/Separator';
import openLink from '../utils/openLink';
import I18n from '../i18n';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';
import ListItem from '../containers/ListItem';

const Item = ({ item, theme }) => (
	<ListItem
		title={item.navigation?.page?.title || I18n.t('Empty_title')}
		onPress={() => openLink(item.navigation?.page?.location?.href)}
		theme={theme}
	/>
);
Item.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string
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
			renderItem={({ item }) => <Item item={item} theme={theme} />}
			ItemSeparatorComponent={() => <Separator theme={theme} />}
			contentContainerStyle={[
				sharedStyles.listContentContainer,
				{
					backgroundColor: themes[theme].auxiliaryBackground,
					borderColor: themes[theme].separatorColor
				}
			]}
			style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			keyExtractor={item => item}
			onEndReached={onEndReached}
			onEndReachedThreshold={5}
		/>
	);
};
VisitorNavigationView.propTypes = {
	theme: PropTypes.string,
	navigation: PropTypes.object
};
VisitorNavigationView.navigationOptions = {
	title: I18n.t('Navigation_history')
};

export default withTheme(VisitorNavigationView);

import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
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

const styles = StyleSheet.create({
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textSemibold
	},
	withoutBorder: {
		borderBottomWidth: 0,
		borderTopWidth: 0
	}
});

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
				},
				!pages.length && styles.withoutBorder
			]}
			style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			ListEmptyComponent={() => <Text style={[styles.noResult, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>}
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

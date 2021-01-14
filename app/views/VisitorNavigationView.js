import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';

import { withTheme } from '../theme';
import RocketChat from '../lib/rocketchat';
import { themes } from '../constants/colors';
import openLink from '../utils/openLink';
import I18n from '../i18n';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';
import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textSemibold,
		...sharedStyles.textAlignCenter
	}
});

const Item = ({ item }) => (
	<List.Item
		title={item.navigation?.page?.title || I18n.t('Empty_title')}
		onPress={() => openLink(item.navigation?.page?.location?.href)}
		translateTitle={false}
	/>
);
Item.propTypes = {
	item: PropTypes.object
};

const VisitorNavigationView = ({ route, theme }) => {
	let offset;
	let total = 0;
	const [pages, setPages] = useState([]);

	const getPages = async() => {
		const rid = route.params?.rid;
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
		<SafeAreaView>
			<FlatList
				data={pages}
				renderItem={({ item }) => <Item item={item} theme={theme} />}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={List.Separator}
				ListHeaderComponent={List.Separator}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				ListEmptyComponent={() => <Text style={[styles.noResult, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>}
				keyExtractor={item => item}
				onEndReached={onEndReached}
				onEndReachedThreshold={5}
			/>
		</SafeAreaView>
	);
};
VisitorNavigationView.propTypes = {
	theme: PropTypes.string,
	route: PropTypes.object
};
VisitorNavigationView.navigationOptions = {
	title: I18n.t('Navigation_history')
};

export default withTheme(VisitorNavigationView);

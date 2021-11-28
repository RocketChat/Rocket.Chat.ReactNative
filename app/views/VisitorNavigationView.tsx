import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { useTheme } from '../theme';
import RocketChat from '../lib/rocketchat';
import { themes } from '../constants/colors';
import openLink from '../utils/openLink';
import I18n from '../i18n';
import debounce from '../utils/debounce';
import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textSemibold,
		...sharedStyles.textAlignCenter
	}
});

const Item = ({ item }: { item: { navigation?: { page?: any } } }) => (
	<List.Item
		title={item.navigation?.page?.title || I18n.t('Empty_title')}
		onPress={() => openLink(item.navigation?.page?.location?.href)}
		translateTitle={false}
	/>
);

interface IVisitorNavigationViewProps {
	navigation: StackNavigationProp<any, 'VisitorNavigationView'>;
	route: RouteProp<{ VisitorNavigationView: { rid: string } }, 'VisitorNavigationView'>;
}

const VisitorNavigationView = ({ navigation, route }: IVisitorNavigationViewProps): JSX.Element => {
	const { theme } = useTheme();

	let offset: number;
	let total = 0;
	const [pages, setPages] = useState([]);

	const getPages = async () => {
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

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Navigation_history')
		});
	}, []);

	useEffect(() => {
		getPages();
	}, []);

	const onEndReached = debounce(() => {
		if (pages.length <= total) {
			getPages();
		}
	}, 300);

	return (
		<SafeAreaView>
			<FlatList
				data={pages}
				renderItem={({ item }) => <Item item={item} />}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={List.Separator}
				ListHeaderComponent={List.Separator}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				ListEmptyComponent={() => (
					<Text style={[styles.noResult, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
				)}
				keyExtractor={item => item}
				onEndReached={onEndReached}
				onEndReachedThreshold={5}
			/>
		</SafeAreaView>
	);
};

export default VisitorNavigationView;

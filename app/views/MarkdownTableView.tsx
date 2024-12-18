import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import I18n from '../i18n';
import { isIOS } from '../lib/methods/helpers';
import { useTheme } from '../theme';
import { ChatsStackParamList } from '../stacks/types';

const MarkdownTableView = (): React.ReactElement => {
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'MarkdownTableView'>>();
	const route = useRoute<RouteProp<ChatsStackParamList, 'MarkdownTableView'>>();
	
	const renderRows = route.params?.renderRows;
	const tableWidth = route.params?.tableWidth;
	const { colors } = useTheme();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Table')
		});
	}, [navigation]);

	if (isIOS) {
		return (
			<ScrollView style={{ backgroundColor: colors.surfaceRoom }} contentContainerStyle={{ width: tableWidth }}>
				{renderRows()}
			</ScrollView>
		);
	}

	return (
		<ScrollView style={{ backgroundColor: colors.surfaceRoom }}>
			<ScrollView horizontal>{renderRows()}</ScrollView>
		</ScrollView>
	);
};

export default MarkdownTableView;

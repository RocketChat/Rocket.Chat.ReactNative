import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';

import I18n from '../i18n';
import { isIOS } from '../lib/methods/helpers';
import { useTheme } from '../theme';
import { ChatsStackParamList } from '../stacks/types';
import { IBaseScreen } from '../definitions';

type IMarkdownTableViewProps = IBaseScreen<ChatsStackParamList, 'MarkdownTableView'>;

const MarkdownTableView = ({ navigation, route }: IMarkdownTableViewProps): React.ReactElement => {
	const renderRows = route.params?.renderRows;
	const tableWidth = route.params?.tableWidth;
	const { colors } = useTheme();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Table')
		});
	}, []);

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

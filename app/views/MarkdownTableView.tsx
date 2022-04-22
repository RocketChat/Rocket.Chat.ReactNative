import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';

import I18n from '../i18n';
import { isIOS } from '../utils/deviceInfo';
import { themes } from '../lib/constants';
import { useTheme } from '../theme';
import { ChatsStackParamList } from '../stacks/types';
import { IBaseScreen } from '../definitions';

type IMarkdownTableViewProps = IBaseScreen<ChatsStackParamList, 'MarkdownTableView'>;

const MarkdownTableView = ({ navigation, route }: IMarkdownTableViewProps): React.ReactElement => {
	const renderRows = route.params?.renderRows;
	const tableWidth = route.params?.tableWidth;
	const { theme } = useTheme();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Table')
		});
	}, []);

	if (isIOS) {
		return (
			<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }} contentContainerStyle={{ width: tableWidth }}>
				{renderRows()}
			</ScrollView>
		);
	}

	return (
		<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
			<ScrollView horizontal>{renderRows()}</ScrollView>
		</ScrollView>
	);
};

export default MarkdownTableView;

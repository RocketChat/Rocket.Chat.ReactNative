import { useLayoutEffect, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { useAppNavigation, useAppRoute } from '~/lib/hooks/navigation';
import { headerLeftCloseModal } from '~/lib/methods/helpers/navigation/headerActions';
import { type TNavigation } from '~/stacks/stackType';
import MarkdownContext from '~/containers/markdown/contexts/MarkdownContext';
import TableGrid from '~/containers/markdown/components/TableGrid';
import styles from '~/containers/markdown/styles';

const TableView = (): ReactElement => {
	const navigation = useAppNavigation<TNavigation, 'TableView'>();
	const {
		params: { value, mentions, channels, username, useRealName }
	} = useAppRoute<TNavigation, 'TableView'>();
	const { colors } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Table'),
			...headerLeftCloseModal(navigation, 'close-table-view')
		});
	}, [navigation]);

	return (
		<View style={{ flex: 1, backgroundColor: colors.surfaceRoom }}>
			<ScrollView testID='table-view-vertical'>
				<ScrollView horizontal contentContainerStyle={styles.tableContent} testID='table-view-horizontal'>
					<MarkdownContext.Provider value={{ mentions, channels, username, useRealName }}>
						<TableGrid value={value} />
					</MarkdownContext.Provider>
				</ScrollView>
			</ScrollView>
		</View>
	);
};

export default TableView;

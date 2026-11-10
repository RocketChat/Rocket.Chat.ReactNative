import { type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { type Table as TableProps } from '@rocket.chat/message-parser';

import Navigation from '~/lib/navigation/appNavigation';
import { useTheme } from '~/theme';
import { useMarkdownContext } from '../contexts/MarkdownContext';
import styles from '../styles';
import TableGrid from './TableGrid';

const PREVIEW_ROWS = 3;

interface ITableProps {
	value: TableProps['value'];
}

const Table = ({ value }: ITableProps): ReactElement => {
	const { colors } = useTheme();
	const { mentions, channels, username, useRealName, onLongPress } = useMarkdownContext();
	const preview = { header: value.header, rows: value.rows.slice(0, PREVIEW_ROWS) };

	const onPress = () => Navigation.navigate('TableView', { value, mentions, channels, username, useRealName });

	return (
		<Pressable accessibilityRole='button' onPress={onPress} onLongPress={onLongPress}>
			<View pointerEvents='none' style={[styles.tablePreview, { borderColor: colors.strokeLight }]}>
				<TableGrid value={preview} />
			</View>
		</Pressable>
	);
};

export default Table;

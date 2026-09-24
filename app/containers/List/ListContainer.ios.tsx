import { useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host } from '@expo/ui';
import { Group, List, RNHostView } from '@expo/ui/swift-ui';
import { alignmentGuide, frame, listRowInsets, listStyle, onGeometryChange, tag } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '~/theme';
import ListSection from './ListSection';
import ListItem from './ListItem';
import ListRadio from './ListRadio';
import { isNativeListRow, isNativeListSection } from './native/rowMarkers';
import { flattenListChildren, isListSeparator } from './listChildren';
import { NativeListContext, NativeListRowRendererContext } from './native/context';
import { ICON_SIZE, PADDING_HORIZONTAL } from './constants';

const styles = StyleSheet.create({
	host: {
		flex: 1
	}
});

const insetGroupedModifiers = [listStyle('insetGrouped')];
const sidebarModifiers = [listStyle('sidebar')];

export interface IListSelection {
	selectedTag: string | null;
}

interface IListContainer {
	children: (ReactElement | null)[] | ReactElement | null;
	testID?: string;
	selection?: IListSelection;
}

const isSection = (element: ReactElement) => element.type === ListSection || isNativeListSection(element.type);
const isNativeRow = (element: ReactElement) =>
	element.type === ListItem || element.type === ListRadio || isNativeListRow(element.type);
const hasLeftIcon = (element: ReactElement) => Boolean((element.props as { left?: unknown }).left);
const rowSelectionTag = (element: ReactElement) => {
	const { selectionTag, testID } = element.props as { selectionTag?: string; testID?: string };
	return selectionTag ?? testID;
};

const selectedTags = ({ selectedTag }: IListSelection) => (selectedTag ? [selectedTag] : []);

const ListContainer = ({ children, testID, selection }: IListContainer) => {
	const { theme } = useTheme();
	const [rowWidth, setRowWidth] = useState(0);

	const selectionTag = (row: ReactElement) => {
		const rowTag = rowSelectionTag(row);
		return rowTag && selection ? [tag(rowTag)] : [];
	};

	const rowModifiers = (row: ReactElement) => [
		frame({ maxWidth: Number.MAX_SAFE_INTEGER }),
		alignmentGuide('listRowSeparatorLeading', hasLeftIcon(row) ? PADDING_HORIZONTAL * 2 + ICON_SIZE : PADDING_HORIZONTAL),
		onGeometryChange(({ width }) => setRowWidth(current => (current === width ? current : width))),
		listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
		...selectionTag(row)
	];

	const renderHostedRow = (row: ReactElement) => (
		<Group key={row.key} modifiers={rowModifiers(row)}>
			<RNHostView matchContents>
				<NativeListContext.Provider value='hosted'>
					<View style={{ width: rowWidth }}>{row}</View>
				</NativeListContext.Provider>
			</RNHostView>
		</Group>
	);

	const renderNativeRow = (row: ReactElement) => (
		<Group key={row.key} modifiers={selectionTag(row)}>
			{row}
		</Group>
	);

	const renderRow = (row: ReactElement) => (isNativeRow(row) ? renderNativeRow(row) : renderHostedRow(row));

	return (
		<NativeListContext.Provider value='native'>
			<NativeListRowRendererContext.Provider value={renderRow}>
				<Host style={styles.host} colorScheme={theme === 'light' ? 'light' : 'dark'}>
					<List
						modifiers={selection ? sidebarModifiers : insetGroupedModifiers}
						selection={selection ? selectedTags(selection) : undefined}
						testID={testID}>
						{flattenListChildren(children)
							.filter(element => !isListSeparator(element))
							.map(element => (isSection(element) ? element : renderRow(element)))}
					</List>
				</Host>
			</NativeListRowRendererContext.Provider>
		</NativeListContext.Provider>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;

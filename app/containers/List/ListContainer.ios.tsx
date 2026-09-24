import { Children, cloneElement, Fragment, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host } from '@expo/ui';
import { Group, List, RNHostView, Section, Text } from '@expo/ui/swift-ui';
import { alignmentGuide, frame, listRowInsets, listStyle, onGeometryChange, tag } from '@expo/ui/swift-ui/modifiers';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import ListInfo from './ListInfo';
import ListSection from './ListSection';
import ListSeparator from './ListSeparator';
import ListItem from './ListItem';
import ListRadio from './ListRadio';
import { isNativeListRow } from './nativeListRow';
import { NativeListContext } from './NativeListContext';
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

interface ISectionProps {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
}

interface IInfoProps {
	info: string;
	translateInfo?: boolean;
}

const flatten = (children: ReactNode, keyPrefix = ''): ReactElement[] =>
	Children.toArray(children).flatMap(child => {
		if (!isValidElement<{ children?: ReactNode }>(child)) {
			return [];
		}
		const key = `${keyPrefix}${child.key}`;
		return child.type === Fragment ? flatten(child.props.children, key) : [cloneElement(child, { key })];
	});

const isSeparator = (element: ReactElement) => element.type === ListSeparator;
const isInfo = (element: ReactElement): element is ReactElement<IInfoProps> => element.type === ListInfo;
const isSection = (element: ReactElement): element is ReactElement<ISectionProps> => element.type === ListSection;
const isNativeRow = (element: ReactElement) =>
	element.type === ListItem || element.type === ListRadio || isNativeListRow(element.type);
const hasLeftIcon = (element: ReactElement) => Boolean((element.props as { left?: unknown }).left);
const rowSelectionTag = (element: ReactElement) => {
	const { selectionTag, testID } = element.props as { selectionTag?: string; testID?: string };
	return selectionTag ?? testID;
};

const selectedTags = ({ selectedTag }: IListSelection) => (selectedTag ? [selectedTag] : []);

const translate = (text: string, shouldTranslate = true) => (shouldTranslate ? I18n.t(text) : text);

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
		onGeometryChange(({ width }) => setRowWidth(width)),
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

	const renderSection = (section: ReactElement<ISectionProps>) => {
		const { title, translateTitle, children: sectionChildren } = section.props;
		const elements = flatten(sectionChildren).filter(element => !isSeparator(element));
		const infos = elements.filter(isInfo);
		const rows = elements.filter(element => !isInfo(element));
		const footer = infos.length ? (
			<>
				{infos.map(info => (
					<Text key={info.key}>{translate(info.props.info, info.props.translateInfo)}</Text>
				))}
			</>
		) : undefined;

		return (
			<Section key={section.key} title={title ? translate(title, translateTitle) : undefined} footer={footer}>
				{rows.map(renderRow)}
			</Section>
		);
	};

	return (
		<NativeListContext.Provider value='native'>
			<Host style={styles.host} colorScheme={theme === 'light' ? 'light' : 'dark'}>
				<List
					modifiers={selection ? sidebarModifiers : insetGroupedModifiers}
					selection={selection ? selectedTags(selection) : undefined}
					testID={testID}>
					{flatten(children)
						.filter(element => !isSeparator(element))
						.map(element => (isSection(element) ? renderSection(element) : renderRow(element)))}
				</List>
			</Host>
		</NativeListContext.Provider>
	);
};

ListContainer.displayName = 'List.Container';

export default ListContainer;

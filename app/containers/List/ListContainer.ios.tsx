import { Children, cloneElement, Fragment, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Host } from '@expo/ui';
import { Group, List, RNHostView, Section, Text } from '@expo/ui/swift-ui';
import { alignmentGuide, frame, listRowInsets, listStyle, onGeometryChange } from '@expo/ui/swift-ui/modifiers';

import I18n from '~/i18n';
import { useTheme } from '~/theme';
import ListInfo from './ListInfo';
import ListSection from './ListSection';
import ListSeparator from './ListSeparator';
import { NativeListContext } from './NativeListContext';
import { ICON_SIZE, PADDING_HORIZONTAL } from './constants';

const styles = StyleSheet.create({
	host: {
		flex: 1
	}
});

const listModifiers = [listStyle('insetGrouped')];

interface IListContainer {
	children: (ReactElement | null)[] | ReactElement | null;
	testID?: string;
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
const hasLeftIcon = (element: ReactElement) => Boolean((element.props as { left?: unknown }).left);

const translate = (text: string, shouldTranslate = true) => (shouldTranslate ? I18n.t(text) : text);

const ListContainer = ({ children, testID }: IListContainer) => {
	const { theme } = useTheme();
	const [rowWidth, setRowWidth] = useState(0);

	const rowModifiers = (row: ReactElement) => [
		frame({ maxWidth: Number.MAX_SAFE_INTEGER }),
		alignmentGuide('listRowSeparatorLeading', hasLeftIcon(row) ? PADDING_HORIZONTAL * 2 + ICON_SIZE : PADDING_HORIZONTAL),
		onGeometryChange(({ width }) => setRowWidth(width)),
		listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 })
	];

	const renderRow = (row: ReactElement) => (
		<Group key={row.key} modifiers={rowModifiers(row)}>
			<RNHostView matchContents>
				<View style={{ width: rowWidth }}>{row}</View>
			</RNHostView>
		</Group>
	);

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
		<NativeListContext.Provider value>
			<Host style={styles.host} colorScheme={theme === 'light' ? 'light' : 'dark'}>
				<List modifiers={listModifiers} testID={testID}>
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

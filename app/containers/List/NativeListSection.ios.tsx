import { useContext, type ReactElement, type ReactNode } from 'react';
import { Section, Text } from '@expo/ui/swift-ui';

import ListInfo from './ListInfo';
import { flattenListChildren, isListSeparator } from './listChildren';
import { NativeListRowRendererContext } from './NativeListContext';
import { translateListText } from './nativeListItemProps';

interface IInfoProps {
	info: string;
	translateInfo?: boolean;
}

export interface INativeListSection {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
}

const isInfo = (element: ReactElement): element is ReactElement<IInfoProps> => element.type === ListInfo;

const NativeListSection = ({ children, title, translateTitle }: INativeListSection) => {
	const renderRow = useContext(NativeListRowRendererContext);
	const elements = flattenListChildren(children).filter(element => !isListSeparator(element));
	const infos = elements.filter(isInfo);
	const rows = elements.filter(element => !isInfo(element));
	const footer = infos.length ? (
		<>
			{infos.map(info => (
				<Text key={info.key}>{translateListText(info.props.info, info.props.translateInfo)}</Text>
			))}
		</>
	) : undefined;

	if (!rows.length && !infos.length) {
		return null;
	}

	return (
		<Section title={title ? translateListText(title, translateTitle) : undefined} footer={footer}>
			{rows.map(renderRow)}
		</Section>
	);
};

export default NativeListSection;

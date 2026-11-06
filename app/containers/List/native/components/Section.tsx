import { type ReactElement } from 'react';
import { Text, View } from 'react-native';

import ListInfo from '~/containers/List/components/ListInfo';
import { useSecondaryLabelColor } from '~/containers/List/hooks/useSecondaryLabelColor';
import { flattenListChildren, isListSeparator } from '~/containers/List/utils/listChildren';
import { useTheme } from '~/theme';
import { useNativeListContext } from '../context';
import { translateListText } from '../utils/itemProps';
import { type INativeListSection } from '../types';
import NativeListSectionHeader from './SectionHeader';
import styles from '../styles';

interface IInfoProps {
	info: string;
	translateInfo?: boolean;
}

const isInfo = (element: ReactElement): element is ReactElement<IInfoProps> => element.type === ListInfo;

const isSelected = (row?: ReactElement) => Boolean((row?.props as { selected?: boolean } | undefined)?.selected);

const NativeListSection = ({ children, title, translateTitle, headerTrailing }: INativeListSection) => {
	const { colors } = useTheme();
	const secondaryLabel = useSecondaryLabelColor();
	const context = useNativeListContext();
	const elements = flattenListChildren(children).filter(element => !isListSeparator(element));
	const infos = elements.filter(isInfo);
	const rows = elements.filter(element => !isInfo(element));

	if (!rows.length && !infos.length) {
		return null;
	}

	return (
		<>
			{title ? null : <View style={context?.sectionIndex === 0 ? styles.firstSectionSpacer : styles.sectionSpacer} />}
			{title ? <NativeListSectionHeader title={translateListText(title, translateTitle)} trailing={headerTrailing} /> : null}
			{rows.length ? (
				<View style={[styles.card, { backgroundColor: colors.surfaceLight }]}>
					{rows.map((row, index) => {
						const next = rows[index + 1];
						const hasSeparator = Boolean(next) && !isSelected(row) && !isSelected(next);
						return (
							<View key={row.key} style={[styles.rowContainer, isSelected(row) && { backgroundColor: colors.surfaceSelected }]}>
								{row}
								{hasSeparator ? <View style={[styles.separator, { backgroundColor: colors.strokeExtraLight }]} /> : null}
							</View>
						);
					})}
				</View>
			) : null}
			{infos.map(info => (
				<View key={info.key}>
					<Text lineBreakStrategyIOS='standard' style={[styles.footer, { color: secondaryLabel }]}>
						{translateListText(info.props.info, info.props.translateInfo)}
					</Text>
				</View>
			))}
			{infos.length ? null : <View style={styles.belowCardSpacer} />}
		</>
	);
};

export default NativeListSection;

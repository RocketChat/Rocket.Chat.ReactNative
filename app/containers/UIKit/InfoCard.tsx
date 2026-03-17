import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { useTheme } from '../../theme';
import { type IIcon, type IIconButton, type IInfoCard, type IInfoCardRow } from './interfaces';

const styles = StyleSheet.create({
	card: {
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4,
		overflow: 'hidden'
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12
	},
	rowContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap'
	},
	rowElement: {
		marginHorizontal: 4
	}
});

const renderRowElement = (parser: IInfoCard['parser'], element: IInfoCardRow['elements'][number], key: string) => {
	if (element.type === 'icon' && parser.icon) {
		return (
			<View key={key} style={styles.rowElement}>
				{parser.icon(element as IIcon, BlockContext.NONE)}
			</View>
		);
	}

	if (element.type === 'mrkdwn' && parser.mrkdwn) {
		return (
			<View key={key} style={styles.rowElement}>
				{parser.mrkdwn(element as any, BlockContext.NONE)}
			</View>
		);
	}

	if (element.type === 'plain_text' && parser.plain_text) {
		return (
			<View key={key} style={styles.rowElement}>
				{parser.plain_text(element as any, BlockContext.NONE)}
			</View>
		);
	}

	return null;
};

const renderRowAction = (parser: IInfoCard['parser'], action: IIconButton | undefined, _appId?: string, _blockId?: string) => {
	if (!action || !parser.icon_button) {
		return null;
	}

	// TODO: Temporarily removed until we have call history implemented
	return null;

	// return parser.icon_button(
	// 	{
	// 		...action,
	// 		appId: action.appId || appId || '',
	// 		blockId: action.blockId || blockId || ''
	// 	},
	// 	BlockContext.ACTION
	// );
};

export const InfoCard = ({ rows, parser, appId, blockId }: IInfoCard) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.card, { backgroundColor: colors.surfaceNeutral, borderColor: colors.strokeExtraLight }]}>
			{rows.map((row, index) => (
				<View
					key={`${blockId || 'info-card'}-${index}`}
					style={[
						styles.row,
						{
							backgroundColor: row.background === 'default' ? colors.surfaceLight : undefined
						}
					]}>
					<View style={styles.rowContent}>
						{row.elements.map((element, elementIndex) => renderRowElement(parser, element, `${index}-${elementIndex}`))}
					</View>
					{row.action ? renderRowAction(parser, row.action, appId, blockId) : null}
				</View>
			))}
		</View>
	);
};

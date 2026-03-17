import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { useTheme } from '../../theme';
import { type IIcon, type IIconButton, type IInfoCard, type IInfoCardRow } from './interfaces';

const styles = StyleSheet.create({
	card: {
		maxWidth: 345,
		borderWidth: 1,
		borderRadius: 16,
		overflow: 'hidden',
		alignSelf: 'flex-start',
		marginBottom: 8
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16
	},
	rowContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap'
	},
	rowElement: {
		marginRight: 12,
		marginBottom: 2
	},
	rowAction: {
		marginLeft: 12
	}
});

const renderRowElement = (parser: IInfoCard['parser'], element: IInfoCardRow['elements'][number], key: string) => {
	if (element.type === 'icon' && parser.icon) {
		return (
			<View key={key} style={styles.rowElement}>
				{parser.icon(element as IIcon, BlockContext.SECTION)}
			</View>
		);
	}

	if (element.type === 'mrkdwn' && parser.mrkdwn) {
		return (
			<View key={key} style={styles.rowElement}>
				{parser.mrkdwn(element as any, BlockContext.SECTION)}
			</View>
		);
	}

	if (parser.plain_text) {
		return (
			<View key={key} style={styles.rowElement}>
				{parser.plain_text(element as any, BlockContext.SECTION)}
			</View>
		);
	}

	return null;
};

const renderRowAction = (parser: IInfoCard['parser'], action: IIconButton | undefined, appId?: string, blockId?: string) => {
	if (!action || !parser.icon_button) {
		return null;
	}

	return parser.icon_button(
		{
			...action,
			appId: action.appId || appId || '',
			blockId: action.blockId || blockId || ''
		},
		BlockContext.ACTION
	);
};

export const InfoCard = ({ rows, parser, appId, blockId }: IInfoCard) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.card, { backgroundColor: colors.surfaceNeutral, borderColor: colors.strokeLight }]}>
			{rows.map((row, index) => {
				const rowBackgroundColor = row.background === 'default' ? colors.surfaceLight : colors.surfaceNeutral;

				return (
					<View
						key={`${blockId || 'info-card'}-${index}`}
						style={[
							styles.row,
							{
								backgroundColor: rowBackgroundColor
							}
						]}>
						<View style={styles.rowContent}>
							{row.elements.map((element, elementIndex) => renderRowElement(parser, element, `${index}-${elementIndex}`))}
						</View>
						{row.action ? <View style={styles.rowAction}>{renderRowAction(parser, row.action, appId, blockId)}</View> : null}
					</View>
				);
			})}
		</View>
	);
};

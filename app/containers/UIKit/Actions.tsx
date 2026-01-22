import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import Button from '../Button';
import I18n from '../../i18n';
import { type IActions } from './interfaces';

const styles = StyleSheet.create({
	hidden: {
		overflow: 'hidden',
		height: 0
	}
});

export const Actions = ({ blockId, appId, elements, parser }: IActions) => {
	const [showMoreVisible, setShowMoreVisible] = useState(() => elements && elements.length > 5);
	
	const shouldShowMore = elements && elements.length > 5;
	const maxVisible = 5;

	// Always render all elements to maintain consistent hook calls
	// This ensures hooks are always called in the same order
	const renderedElements = useMemo(() => {
		if (!elements || !parser) {
			return null;
		}
		// Use View wrapper to conditionally hide elements instead of conditionally rendering
		return elements.map((element, index) => {
			const isVisible = !showMoreVisible || index < maxVisible;
			const component = parser.renderActions({ blockId, appId, ...element }, BlockContext.ACTION, parser);
			// Always render the component, but hide it with styles if needed
			return (
				<View key={element.actionId || `action-${index}`} style={!isVisible ? styles.hidden : undefined}>
					{component}
				</View>
			);
		});
	}, [elements, parser, blockId, appId, showMoreVisible, maxVisible]);

	return (
		<>
			{renderedElements}
			{shouldShowMore && showMoreVisible && (
				<Button title={I18n.t('Show_more')} onPress={() => setShowMoreVisible(false)} />
			)}
		</>
	);
};

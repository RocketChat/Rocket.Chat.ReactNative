import React, { useState } from 'react';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import Button from '../Button';
import I18n from '../../i18n';

interface IActions {
	blockId: string;
	appId: string;
	elements: any[];
	parser: any;
	theme: string;
}

export const Actions = ({ blockId, appId, elements, parser, theme }: IActions) => {
	const [showMoreVisible, setShowMoreVisible] = useState(() => elements.length > 5);
	const renderedElements = showMoreVisible ? elements.slice(0, 5) : elements;

	const Elements = () =>
		renderedElements.map((element: any) => parser.renderActions({ blockId, appId, ...element }, BLOCK_CONTEXT.ACTION, parser));

	return (
		<>
			{/* @ts-ignore*/}
			<Elements />
			{showMoreVisible && <Button theme={theme} title={I18n.t('Show_more')} onPress={() => setShowMoreVisible(false)} />}
		</>
	);
};

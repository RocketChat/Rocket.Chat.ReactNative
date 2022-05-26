import React, { useState } from 'react';
import { BlockContext } from '@rocket.chat/ui-kit';

import Button from '../Button';
import I18n from '../../i18n';
import { IActions } from './interfaces';

export const Actions = ({ blockId, appId, elements, parser }: IActions) => {
	const [showMoreVisible, setShowMoreVisible] = useState(() => elements && elements.length > 5);
	const renderedElements = showMoreVisible ? elements?.slice(0, 5) : elements;

	const Elements = () => (
		<>{renderedElements?.map(element => parser?.renderActions({ blockId, appId, ...element }, BlockContext.ACTION, parser))}</>
	);

	return (
		<>
			<Elements />
			{showMoreVisible && <Button title={I18n.t('Show_more')} onPress={() => setShowMoreVisible(false)} />}
		</>
	);
};

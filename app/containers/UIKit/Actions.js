import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import Button from '../Button';
import I18n from '../../i18n';

export const Actions = ({
	blockId, appId, elements, parser, theme
}) => {
	const [showMoreVisible, setShowMoreVisible] = useState(() => elements.length > 5);
	const renderedElements = showMoreVisible ? elements.slice(0, 5) : elements;

	const Elements = () => renderedElements
		.map(element => parser.renderActions({ blockId, appId, ...element }, BLOCK_CONTEXT.ACTION, parser));

	return (
		<>
			<Elements />
			{showMoreVisible && (<Button theme={theme} title={I18n.t('Show_more')} onPress={() => setShowMoreVisible(false)} />)}
		</>
	);
};

Actions.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	elements: PropTypes.array,
	parser: PropTypes.object,
	theme: PropTypes.string
};

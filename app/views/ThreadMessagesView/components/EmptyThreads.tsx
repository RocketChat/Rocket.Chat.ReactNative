import React from 'react';
import I18n from 'i18n-js';

import { Filter } from '../filters';
import BackgroundContainer from '../../../containers/BackgroundContainer';

type TEmptyThreads = {
	currentFilter: Filter;
};

const EmptyThreads = ({ currentFilter }: TEmptyThreads) => {
	let text;
	if (currentFilter === Filter.Following) {
		text = I18n.t('No_threads_following');
	} else if (currentFilter === Filter.Unread) {
		text = I18n.t('No_threads_unread');
	} else {
		text = I18n.t('No_threads');
	}
	return <BackgroundContainer text={text} />;
};

export default EmptyThreads;

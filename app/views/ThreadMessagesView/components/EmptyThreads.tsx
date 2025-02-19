import React from 'react';

import I18n from '../../../i18n';
import BackgroundContainer from '../../../containers/BackgroundContainer';
import { Filter } from '../filters';

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

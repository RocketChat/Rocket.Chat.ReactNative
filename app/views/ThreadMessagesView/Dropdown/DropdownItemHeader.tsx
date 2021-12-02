import React from 'react';

import { FILTER } from '../filters';
import I18n from '../../../i18n';
import DropdownItem from './DropdownItem';

interface IDropdownItemHeader {
	currentFilter: string;
	onPress: () => void;
}

const DropdownItemHeader = ({ currentFilter, onPress }: IDropdownItemHeader): JSX.Element => {
	let text;
	switch (currentFilter) {
		case FILTER.FOLLOWING:
			text = I18n.t('Threads_displaying_following');
			break;
		case FILTER.UNREAD:
			text = I18n.t('Threads_displaying_unread');
			break;
		default:
			text = I18n.t('Threads_displaying_all');
			break;
	}
	return <DropdownItem text={text} iconName='filter' onPress={onPress} />;
};

export default DropdownItemHeader;

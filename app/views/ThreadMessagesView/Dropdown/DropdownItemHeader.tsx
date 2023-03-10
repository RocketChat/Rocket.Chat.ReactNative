import React from 'react';

import { Filter } from '../filters';
import I18n from '../../../i18n';
import DropdownItem from './DropdownItem';

interface IDropdownItemHeader {
	currentFilter: Filter;
	onPress: () => void;
}

const DropdownItemHeader = ({ currentFilter, onPress }: IDropdownItemHeader): JSX.Element => {
	let text;
	switch (currentFilter) {
		case Filter.Following:
			text = I18n.t('Threads_displaying_following');
			break;
		case Filter.Unread:
			text = I18n.t('Threads_displaying_unread');
			break;
		default:
			text = I18n.t('Threads_displaying_all');
			break;
	}
	return <DropdownItem text={text} iconName='filter' onPress={onPress} />;
};

export default DropdownItemHeader;

import React from 'react';
import PropTypes from 'prop-types';

import DropdownItem from './DropdownItem';
import { FILTER } from '../filters';
import I18n from '../../../i18n';

const DropdownItemHeader = ({ currentFilter, onPress }) => {
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

DropdownItemHeader.propTypes = {
	currentFilter: PropTypes.string,
	onPress: PropTypes.func
};

export default DropdownItemHeader;

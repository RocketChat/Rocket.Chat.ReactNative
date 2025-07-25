import React from 'react';
import { I18nManager } from 'react-native';

import ListIcon, { IListIcon } from './List/ListIcon';

const NewWindowIcon = (props: Omit<IListIcon, 'name'>) => (
	<ListIcon name='new-window' style={I18nManager.isRTL ? { transform: [{ rotateY: '180deg' }] } : null} {...props} />
);

export default NewWindowIcon;

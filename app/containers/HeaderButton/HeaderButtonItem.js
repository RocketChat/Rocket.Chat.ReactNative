import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';

export const BUTTON_HIT_SLOP = {
	top: 5, right: 5, bottom: 5, left: 5
};

const HeaderButtonItem = ({ name, onPress, testID, theme }) => (
	<Touchable onPress={onPress} testID='room-view-header-threads' hitSlop={BUTTON_HIT_SLOP} style={{ marginHorizontal: 6 }}>
		<>
			<CustomIcon name={name} size={24} color={themes[theme].headerTintColor} />
		</>
	</Touchable>
);

export default withTheme(HeaderButtonItem);

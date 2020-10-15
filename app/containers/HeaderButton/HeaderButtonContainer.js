import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

const HeaderButtonContainer = ({ children, left }) => (
	<View style={[left ? { marginLeft: 5 } : { marginRight: 5 }, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
		{children}
	</View>
);

export default HeaderButtonContainer;

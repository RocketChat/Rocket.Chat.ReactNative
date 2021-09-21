/* eslint-disable react/no-array-index-key */
import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import Inline from './Inline';

const OrderedList = React.memo(({ value }) => (
	<>
		{value.map((item, index) => (
			<View style={{ flexDirection: 'row' }}>
				<Text>{index + 1}. </Text>
				<Inline key={index} value={item.value} />
			</View>
		))}
	</>
));

OrderedList.propTypes = {
	value: PropTypes.array
};

export default OrderedList;

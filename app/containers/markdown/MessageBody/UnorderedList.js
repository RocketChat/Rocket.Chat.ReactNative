/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import Inline from './Inline';

const UnorderedList = React.memo(({ value }) => (
	<>
		{value.map((item, index) => (
			<Inline key={index} value={item.value} />
		))}
	</>
));

UnorderedList.propTypes = {
	value: PropTypes.array
};

export default UnorderedList;

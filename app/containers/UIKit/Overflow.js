import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import Touch from '../../utils/touch';

export const Overflow = ({ element }) => {
	console.log(element);
	const [show, onShow] = useState(false);
	return (
		<Touch onPress={() => onShow(!show)} theme='light'>
			<CustomIcon size={18} name='menu' />
		</Touch>
	);
};
Overflow.propTypes = {
	element: PropTypes.any
};

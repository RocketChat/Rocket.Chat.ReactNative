import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';

const CustomFields = ({ customFields, theme }) => {
	if (customFields) {
		return Object.keys(customFields).map((title, index) => {
			if (!customFields[title]) {
				return;
			}
			return <Item label={title} content={customFields[title]} theme={theme} key={index} />;
		});
	}

	return null;
};
CustomFields.propTypes = {
	customFields: PropTypes.object,
	theme: PropTypes.string
};

export default CustomFields;

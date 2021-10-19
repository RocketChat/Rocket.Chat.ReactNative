import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';

const CustomFields = ({ customFields, theme, currentUser }) => {
	if (customFields) {
		const isAdmin = ['admin', 'livechat-manager'].find(role => currentUser.roles.includes(role)) !== undefined;

		return (
			Object.keys(customFields).map((title) => {
				if (!customFields[title]) {
					return;
				}
				if ((!isAdmin && title === 'VideoUrl')
				|| (!isAdmin && title === 'ConnectIds')
				|| (!isAdmin && title === 'Age')
				|| (!isAdmin && title === 'Location')
				|| (!isAdmin && title === 'T1D Since')
				|| (!isAdmin && title === 'Stage of Life')
				|| (!isAdmin && title === 'Insulin Delivery Method')
				) {
					return;
				}
				return (
					<Item
						label={title}
						content={customFields[title]}
						theme={theme}
					/>
				);
			})
		);
	}

	return null;
};
CustomFields.propTypes = {
	customFields: PropTypes.object,
	currentUser: PropTypes.object,
	theme: PropTypes.string
};

export default CustomFields;

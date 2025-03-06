import React from 'react';

import Item from './Item';

const CustomFields = ({ customFields }: { customFields?: { [key: string]: string } }): React.ReactElement | null => {
	if (customFields) {
		return (
			<>
				{Object.keys(customFields).map((title: string) => {
					if (!customFields[title]) return null;
					return <Item label={title} content={customFields[title]} />;
				})}
			</>
		);
	}

	return null;
};

export default CustomFields;

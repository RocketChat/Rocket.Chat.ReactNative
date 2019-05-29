import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const FileButton = React.memo(({ onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-actions'
		accessibilityLabel='Message_actions'
		icon='plus'
	/>
));

FileButton.propTypes = {
	onPress: PropTypes.func.isRequired
};

export default FileButton;

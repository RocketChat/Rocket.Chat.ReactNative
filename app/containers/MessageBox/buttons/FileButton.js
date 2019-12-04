import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const FileButton = React.memo(({ theme, onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-actions'
		accessibilityLabel='Message_actions'
		icon='plus'
		theme={theme}
	/>
));

FileButton.propTypes = {
	theme: PropTypes.string,
	onPress: PropTypes.func.isRequired
};

export default FileButton;

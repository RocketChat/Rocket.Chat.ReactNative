import React from 'react';
import PropTypes from 'prop-types';

import BaseButton from './BaseButton';

const CancelEditingButton = React.memo(({ onPress }) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-cancel-editing'
		accessibilityLabel='Cancel_editing'
		icon='cross'
	/>
));

CancelEditingButton.propTypes = {
	onPress: PropTypes.func.isRequired
};

export default CancelEditingButton;

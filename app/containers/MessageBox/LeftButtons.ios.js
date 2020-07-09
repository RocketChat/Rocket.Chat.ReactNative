import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import { CancelEditingButton, ActionsButton } from './buttons';
import styles from './styles';

const LeftButtons = React.memo(({
	theme, showMessageBoxActions, editing, editCancel, isActionsEnabled
}) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} theme={theme} />;
	}
	if (isActionsEnabled) {
		return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
	}
	return <View style={styles.buttonsWhitespace} />;
});

LeftButtons.propTypes = {
	theme: PropTypes.string,
	showMessageBoxActions: PropTypes.func.isRequired,
	editing: PropTypes.bool,
	editCancel: PropTypes.func.isRequired,
	isActionsEnabled: PropTypes.bool
};

export default LeftButtons;

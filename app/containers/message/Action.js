import React from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import styles from './styles';

const Action = React.memo(({
	text, type, msg, runSlashCommand
}) => {
	if (type === 'button') {
		return <Button style={styles.actionButton} title={text} onPress={() => runSlashCommand(msg)} />;
	}
	return null;
}, () => true);

Action.propTypes = {
	text: PropTypes.string,
	type: PropTypes.string,
	msg: PropTypes.string,
	runSlashCommand: PropTypes.func
};

Action.displayName = 'Action';

export default Action;

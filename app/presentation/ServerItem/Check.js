import React from 'react';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

const Check = React.memo(() => <CustomIcon style={styles.checkIcon} size={22} name='check' />);

export default Check;

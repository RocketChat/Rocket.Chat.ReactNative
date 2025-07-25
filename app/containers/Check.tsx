import React from 'react';

import { CustomIcon } from './CustomIcon';
import { themes } from '../lib/constants';
import { useTheme } from '../theme';

const Check = React.memo(() => {
	const { theme } = useTheme();
	return <CustomIcon color={themes[theme].fontInfo} size={22} name='check' />;
});

export default Check;

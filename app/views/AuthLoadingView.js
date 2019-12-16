import React from 'react';

import StatusBar from '../containers/StatusBar';
import { withTheme } from '../theme';

export default React.memo(withTheme(({ theme }) => (
	<>
		<StatusBar theme={theme} />
	</>
)));

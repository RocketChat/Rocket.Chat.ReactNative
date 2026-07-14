import { type ReactElement, type ReactNode } from 'react';
import { A11y } from 'react-native-a11y-order';

import { useA11yGate } from '../stores/A11yGate';

const MessageA11yOrder = ({ children }: { children: ReactNode }): ReactElement => {
	'use memo';

	const enabled = useA11yGate();

	if (!enabled) return <>{children}</>;

	return <A11y.Order>{children}</A11y.Order>;
};

export default MessageA11yOrder;

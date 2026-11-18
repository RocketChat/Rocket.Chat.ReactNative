import { type ReactElement, type ReactNode } from 'react';
import { A11y } from 'react-native-a11y-order';

import { useA11yGate } from '../stores/A11yGate';
import { useMessageField } from '../stores/MessageStore';

const MessageA11yOrder = ({ children }: { children: ReactNode }): ReactElement => {
	const enabled = useA11yGate();
	const updatedAt = useMessageField(item => new Date(item._updatedAt ?? 0).getTime());

	if (!enabled) return <>{children}</>;

	return <A11y.Order key={updatedAt}>{children}</A11y.Order>;
};

export default MessageA11yOrder;

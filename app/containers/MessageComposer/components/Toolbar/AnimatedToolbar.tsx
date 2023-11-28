import { MotiView } from 'moti';
import React, { ReactElement } from 'react';

export const AnimatedToolbar = ({ children }: { children: ReactElement[] }): ReactElement | null => (
	<MotiView
		from={{
			opacity: 0,
			transform: [{ translateY: 10 }]
		}}
		animate={{
			opacity: 1,
			transform: [{ translateY: 0 }]
		}}
		transition={{
			type: 'timing',
			duration: 100
		}}
		exit={{
			opacity: 0
		}}
		style={{
			flexDirection: 'row'
		}}
	>
		{children}
	</MotiView>
);

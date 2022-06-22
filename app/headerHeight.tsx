import React from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { isIOS } from './lib/methods/helpers';

export const headerHeight = isIOS ? 50 : 56;

// TODO: remove this HOC after migrate AttachmentView to hooks
export function withHeaderHeight<T>(Component: React.ComponentType<T>): typeof Component {
	const HeaderHeightComponent = (props: T) => {
		const headerHeight = useHeaderHeight();
		return <Component headerHeight={headerHeight} {...props} />;
	};
	hoistNonReactStatics(HeaderHeightComponent, Component);
	return HeaderHeightComponent;
}

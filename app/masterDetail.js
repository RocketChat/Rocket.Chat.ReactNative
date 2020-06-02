import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { isTablet } from './utils/deviceInfo';

export const MasterDetailContext = React.createContext({ isMasterDetail: false });

export function withMasterDetail(Component) {
	if (isTablet) {
		const MasterDetailComponent = props => (
			<MasterDetailContext.Consumer>
				{contexts => <Component {...props} {...contexts} />}
			</MasterDetailContext.Consumer>
		);
		hoistNonReactStatics(MasterDetailComponent, Component);
		return MasterDetailComponent;
	}
	return Component;
}

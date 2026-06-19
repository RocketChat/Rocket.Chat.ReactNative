import { type ComponentType, forwardRef } from 'react';
import { useWindowDimensions } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { type TNavigationOptions } from '../../definitions/navigationTypes';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT } from '../constants/tablet';
import { isTablet } from '../methods/helpers/deviceInfo';

export const useMasterDetail = (): boolean => {
	const { width } = useWindowDimensions();
	return isTablet && width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
};

export function withMasterDetail<T extends { isMasterDetail: boolean }>(
	Component: ComponentType<T> & TNavigationOptions
): ComponentType<Omit<T, 'isMasterDetail'>> & TNavigationOptions {
	const C = Component as ComponentType<any>;
	const MasterDetailComponent = forwardRef<unknown, Omit<T, 'isMasterDetail'>>((props, ref) => {
		const isMasterDetail = useMasterDetail();
		return <C ref={ref} {...props} isMasterDetail={isMasterDetail} />;
	});

	hoistNonReactStatics(MasterDetailComponent, Component as any);
	return MasterDetailComponent as unknown as ComponentType<Omit<T, 'isMasterDetail'>> & TNavigationOptions;
}

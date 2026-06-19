import { type ComponentType } from 'react';
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
	const MasterDetailComponent = (props: Omit<T, 'isMasterDetail'>) => {
		const isMasterDetail = useMasterDetail();
		return <Component {...(props as T)} isMasterDetail={isMasterDetail} />;
	};

	hoistNonReactStatics(MasterDetailComponent, Component as any);
	return MasterDetailComponent as ComponentType<Omit<T, 'isMasterDetail'>> & TNavigationOptions;
}

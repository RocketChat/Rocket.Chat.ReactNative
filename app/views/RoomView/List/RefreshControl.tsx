import React from 'react';
import { RefreshControl as RefreshControlRN, RefreshControlProps } from 'react-native';

import { useTheme } from '../../../theme';

type TRefreshControlProps = Pick<RefreshControlProps, 'refreshing' | 'onRefresh'>;

export const RefreshControl = ({ refreshing, onRefresh }: TRefreshControlProps): React.ReactElement => {
	const { colors } = useTheme();
	return <RefreshControlRN refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.auxiliaryText} />;
};

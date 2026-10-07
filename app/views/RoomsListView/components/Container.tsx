import { memo, type ReactElement } from 'react';

import SafeAreaView from '~/containers/SafeAreaView';
import { useTheme } from '~/theme';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import TabletHeader from './TabletHeader';

const Container = ({ children }: { children: ReactElement }) => {
	const { colors } = useTheme();
	return (
		<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: colors.surfaceTint }}>
			{hasNativeHeaderBar ? null : <TabletHeader />}
			{children}
		</SafeAreaView>
	);
};

export default memo(Container);

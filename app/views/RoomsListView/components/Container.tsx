import { memo, type ReactElement } from 'react';

import SafeAreaView from '~/containers/SafeAreaView';
import { useTheme } from '~/theme';

const Container = ({ children }: { children: ReactElement }) => {
	const { colors } = useTheme();
	return (
		<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: colors.surfaceTint }}>
			{children}
		</SafeAreaView>
	);
};

export default memo(Container);

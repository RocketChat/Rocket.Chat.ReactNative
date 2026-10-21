import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '~/theme';
import type { IStageTile } from './ConferenceStage';

interface ISpotlightStage<T extends IStageTile> {
	featured: T;
	self?: T;
	renderTile: (tile: T, options?: { floating?: boolean }) => ReactElement;
}

const PIP_WIDTH = 180;

const styles = StyleSheet.create({
	stage: {
		flex: 1,
		paddingHorizontal: 8
	},
	main: {
		flex: 1,
		borderRadius: 8,
		overflow: 'hidden'
	},
	pip: {
		position: 'absolute',
		right: 16,
		bottom: 16,
		width: PIP_WIDTH,
		aspectRatio: 16 / 9,
		borderRadius: 8,
		overflow: 'hidden',
		zIndex: 2,
		elevation: 6,
		shadowColor: '#000',
		shadowOpacity: 0.4,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 }
	}
});

const SpotlightStage = <T extends IStageTile>({ featured, self, renderTile }: ISpotlightStage<T>): ReactElement => {
	const { colors } = useTheme();

	return (
		<View style={styles.stage} testID='conference-spotlight'>
			<View style={[styles.main, { backgroundColor: colors.surfaceNeutral }]}>{renderTile(featured)}</View>
			{self && self.id !== featured.id ? (
				<View style={styles.pip} testID='conference-spotlight-pip'>
					{renderTile(self, { floating: true })}
				</View>
			) : null}
		</View>
	);
};

export default SpotlightStage;

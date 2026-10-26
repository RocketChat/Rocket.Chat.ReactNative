import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { textParser } from './utils';
import { type ILinearScale } from './interfaces';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
		gap: 8
	},
	edgeLabel: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	scale: {
		flexDirection: 'row',
		gap: 8
	},
	stepTouch: {
		flex: 1
	},
	pressed: {
		opacity: 0.7
	},
	step: {
		flex: 1,
		height: 44,
		borderWidth: 1,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	stepText: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	labelsSpacer: {
		flex: 1
	}
});

const MAX_STEPS_PER_ROW = 5;

export const LinearScale = ({ element, value, action, loading }: ILinearScale) => {
	const { colors } = useTheme();
	const [selected, setSelected] = useState<number | undefined>(() => (typeof value === 'number' ? value : undefined));

	useEffect(() => {
		const next = typeof value === 'number' ? value : undefined;
		setSelected(next);
	}, [value]);

	const min = element?.minValue ?? 0;
	const max = element?.maxValue ?? 10;
	const count = max - min + 1;
	if (count <= 0 || count > 25) {
		return null;
	}
	const steps = Array.from({ length: count }, (_, index) => min + index);
	const rows: number[][] = [];
	steps.forEach(step => {
		const last = rows[rows.length - 1];
		if (!last || last.length >= MAX_STEPS_PER_ROW) {
			rows.push([step]);
		} else {
			last.push(step);
		}
	});

	const onSelect = (step: number) => {
		if (!loading && selected !== step) {
			setSelected(step);
			action({ value: step });
		}
	};

	return (
		<View style={styles.container}>
			{element?.preLabel || element?.postLabel ? (
				<View style={styles.scale}>
					{element?.preLabel ? (
						<Text style={[styles.edgeLabel, { color: colors.fontSecondaryInfo }]}>{textParser([element.preLabel])}</Text>
					) : null}
					<View style={styles.labelsSpacer} />
					{element?.postLabel ? (
						<Text style={[styles.edgeLabel, { color: colors.fontSecondaryInfo }]}>{textParser([element.postLabel])}</Text>
					) : null}
				</View>
			) : null}
			{rows.map((row, rowIndex) => (
				<View key={`row-${rowIndex}`} style={styles.scale}>
					{row.map(step => {
						const isSelected = selected === step;
						return (
							<Pressable
								key={step}
								accessible
								accessibilityLabel={`${step}`}
								accessibilityRole='radio'
								accessibilityState={{ selected: isSelected, disabled: loading }}
								testID={`linear-scale-${step}`}
								disabled={loading}
								onPress={() => onSelect(step)}
								style={({ pressed }) => [styles.stepTouch, pressed && styles.pressed]}>
								<View
									style={[
										styles.step,
										{
											borderColor: isSelected ? colors.buttonBackgroundPrimaryDefault : colors.strokeLight,
											backgroundColor: isSelected ? colors.buttonBackgroundPrimaryDefault : colors.surfaceRoom
										}
									]}>
									<Text
										style={[
											styles.stepText,
											{ color: isSelected ? colors.fontWhite : colors.fontTitlesLabels }
										]}>{`${step}`}</Text>
								</View>
							</Pressable>
						);
					})}
					{Array.from({ length: MAX_STEPS_PER_ROW - row.length }, (_, index) => (
						<View key={`spacer-${index}`} style={styles.stepTouch} />
					))}
				</View>
			))}
		</View>
	);
};

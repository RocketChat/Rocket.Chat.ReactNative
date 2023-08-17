import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { BaseButton } from '../Buttons';

export const Quote = () => {
	const { colors } = useTheme();
	return (
		<View
			style={{
				backgroundColor: colors.surfaceTint,
				height: 64,
				width: 250, // TODO: how can we calculate this? It can be % only, because it would be too big on tablets
				borderColor: colors.strokeExtraLight,
				borderLeftColor: colors.strokeMedium,
				borderWidth: 1,
				borderTopRightRadius: 4,
				borderBottomRightRadius: 4,
				paddingLeft: 16,
				padding: 8
			}}
		>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
				<View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', gap: 4 }}>
					<Text
						style={{
							...sharedStyles.textBold,
							color: colors.fontTitlesLabels,
							fontSize: 14,
							lineHeight: 20,
							flexShrink: 1
						}}
						numberOfLines={1}
					>
						Jocelyn Bergson
					</Text>
					<Text
						style={{
							...sharedStyles.textRegular,
							color: colors.fontAnnotation,
							fontSize: 12,
							lineHeight: 16
						}}
					>
						03:34 PM
					</Text>
				</View>
				<BaseButton
					icon='close'
					color={colors.fontDefault}
					onPress={() => alert('remove quote')}
					accessibilityLabel='TODO'
					testID='TODO'
				/>
			</View>
			<Text
				style={{
					...sharedStyles.textRegular,
					color: colors.fontDefault,
					fontSize: 14,
					lineHeight: 20
				}}
				numberOfLines={1}
			>
				Hi everyone, how is everything asdha sdashd asdiuh asdasdiuha sdasdouiha sda
			</Text>
		</View>
	);
};

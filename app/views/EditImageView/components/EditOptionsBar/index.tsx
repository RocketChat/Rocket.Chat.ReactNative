import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { CustomIcon } from '../../../../containers/CustomIcon';
import Touch from '../../../../containers/Touch';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		alignItems: 'center',
		justifyContent: 'space-between'
	}
});

interface IEditOptionsBarProps {
	isCropping: boolean;
	onCancel: () => void;
	onCancelCrop: () => void;
	onContinue: () => Promise<void>;
	crop: () => void;
	rotateLeft: () => void;
	rotateRight: () => void;
	startCrop: () => void;
	openResizeOptions: () => void;
}

const EditOptionsBar = ({
	isCropping,
	onCancel,
	rotateLeft,
	rotateRight,
	startCrop,
	openResizeOptions,
	onContinue,
	crop,
	onCancelCrop
}: IEditOptionsBarProps) => (
	<View style={styles.container}>
		{isCropping ? (
			<>
				<Touch onPress={onCancelCrop}>
					<Text>Cancel</Text>
				</Touch>

				<Touch onPress={crop}>
					<Text>Crop</Text>
				</Touch>
			</>
		) : (
			<>
				<Touch onPress={onCancel}>
					<Text>Cancel</Text>
				</Touch>

				<Touch onPress={rotateLeft}>
					<CustomIcon name='undo' size={24} />
				</Touch>

				<Touch onPress={rotateRight}>
					<CustomIcon name='redo' size={24} />
				</Touch>

				<Touch onPress={startCrop}>
					<CustomIcon name='crop' size={24} />
				</Touch>

				<Touch onPress={openResizeOptions}>
					<CustomIcon name='arrow-expand' size={24} />
				</Touch>

				<Touch onPress={onContinue}>
					<Text>Continue</Text>
				</Touch>
			</>
		)}
	</View>
);

export default EditOptionsBar;

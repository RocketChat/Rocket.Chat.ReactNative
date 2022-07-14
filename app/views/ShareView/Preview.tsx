import React from 'react';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text } from 'react-native';
import prettyBytes from 'pretty-bytes';
import { useHeaderHeight } from '@react-navigation/elements';

import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import { ImageViewer, types } from '../../containers/ImageViewer';
import { useDimensions } from '../../dimensions';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { isAndroid } from '../../lib/methods/helpers';
import { allowPreview } from './utils';
import { THUMBS_HEIGHT } from './constants';
import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import { IShareAttachment } from '../../definitions';

const MESSAGEBOX_HEIGHT = 56;

const styles = StyleSheet.create({
	fileContainer: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	fileName: {
		fontSize: 16,
		marginHorizontal: 10,
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	fileSize: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IIconPreview {
	iconName: TIconsName;
	title: string;
	description?: string;
	theme: TSupportedThemes;
	width: number;
	height: number;
	danger?: boolean;
}

const IconPreview = React.memo(({ iconName, title, description, theme, width, height, danger }: IIconPreview) => (
	<ScrollView
		style={{ backgroundColor: themes[theme].auxiliaryBackground }}
		contentContainerStyle={[styles.fileContainer, { width, height }]}
	>
		<CustomIcon name={iconName} size={56} color={danger ? themes[theme].dangerColor : themes[theme].tintColor} />
		<Text style={[styles.fileName, { color: themes[theme].titleText }]}>{title}</Text>
		{description ? <Text style={[styles.fileSize, { color: themes[theme].bodyText }]}>{description}</Text> : null}
	</ScrollView>
));

interface IPreview {
	item: IShareAttachment;
	theme: TSupportedThemes;
	isShareExtension: boolean;
	length: number;
}

const Preview = React.memo(({ item, theme, isShareExtension, length }: IPreview) => {
	const type = item?.mime;
	const { width, height } = useDimensions();
	const insets = useSafeAreaInsets();
	const headerHeight = useHeaderHeight();
	const thumbsHeight = length > 1 ? THUMBS_HEIGHT : 0;
	const calculatedHeight = height - insets.top - insets.bottom - MESSAGEBOX_HEIGHT - thumbsHeight - headerHeight;

	if (item?.canUpload) {
		// Disable video preview on iOS to save memory
		if (isAndroid && type?.match(/video/)) {
			return (
				<ScrollView style={{ height: calculatedHeight }}>
					<Video
						source={{ uri: item.path }}
						rate={1.0}
						volume={1.0}
						isMuted={false}
						resizeMode={ResizeMode.CONTAIN}
						isLooping={false}
						style={{ width, height: calculatedHeight }}
						useNativeControls
					/>
				</ScrollView>
			);
		}

		// Disallow preview of images too big in order to prevent memory issues on iOS share extension
		if (type?.match(/image/)) {
			if (allowPreview(isShareExtension, item?.size)) {
				return (
					<ImageViewer
						uri={item.path}
						imageComponentType={isShareExtension ? types.REACT_NATIVE_IMAGE : types.FAST_IMAGE}
						width={width}
						height={calculatedHeight}
					/>
				);
			}
		}
		return (
			<IconPreview
				iconName={type?.match(/image/) ? 'image' : 'attach'}
				title={item?.filename}
				description={prettyBytes(item?.size ?? 0)}
				theme={theme}
				width={width}
				height={calculatedHeight}
			/>
		);
	}

	return (
		<IconPreview
			iconName='warning'
			title={I18n.t(item?.error)}
			description={prettyBytes(item?.size ?? 0)}
			theme={theme}
			width={width}
			height={calculatedHeight}
			danger
		/>
	);
});

export default Preview;

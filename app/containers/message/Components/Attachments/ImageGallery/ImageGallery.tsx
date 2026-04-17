import React, { useState } from 'react';
import { View } from 'react-native';

import { type IAttachment, type IUserMessage } from '../../../../../definitions';
import { type TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import ImageGalleryItem from './ImageGalleryItem';
import styles, { GAP, GALLERY_HEIGHT, CELL_HEIGHT_HALF } from './styles';

interface IImageGallery {
	files: IAttachment[];
	showAttachment?: (file: IAttachment) => void;
	author?: IUserMessage;
	getCustomEmoji?: TGetCustomEmoji;
}

const ImageGallery = ({ files, showAttachment, author, getCustomEmoji }: IImageGallery) => {
	const [containerWidth, setContainerWidth] = useState(0);

	if (containerWidth === 0) {
		return (
			<View style={{ height: GALLERY_HEIGHT }} onLayout={ev => setContainerWidth(Math.floor(ev.nativeEvent.layout.width))} />
		);
	}

	const cellWidth = Math.floor((containerWidth - GAP) / 2);
	const count = files.length;

	// 2 images: two equal columns, full height
	if (count === 2) {
		return (
			<View
				style={[styles.galleryContainer, { width: containerWidth, height: GALLERY_HEIGHT, gap: GAP }]}
				onLayout={ev => setContainerWidth(Math.floor(ev.nativeEvent.layout.width))}>
				<ImageGalleryItem
					file={files[0]}
					author={author}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					width={cellWidth}
					height={GALLERY_HEIGHT}
				/>
				<ImageGalleryItem
					file={files[1]}
					author={author}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					width={cellWidth}
					height={GALLERY_HEIGHT}
				/>
			</View>
		);
	}

	// 3 images: left column 1 tall, right column 2 stacked
	if (count === 3) {
		return (
			<View
				style={[styles.galleryContainer, { width: containerWidth, height: GALLERY_HEIGHT, gap: GAP }]}
				onLayout={ev => setContainerWidth(Math.floor(ev.nativeEvent.layout.width))}>
				<View style={styles.leftColumn}>
					<ImageGalleryItem
						file={files[0]}
						author={author}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						width={cellWidth}
						height={GALLERY_HEIGHT}
					/>
				</View>
				<View style={[styles.rightColumn, { gap: GAP }]}>
					<ImageGalleryItem
						file={files[1]}
						author={author}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						width={cellWidth}
						height={CELL_HEIGHT_HALF}
					/>
					<ImageGalleryItem
						file={files[2]}
						author={author}
						showAttachment={showAttachment}
						getCustomEmoji={getCustomEmoji}
						width={cellWidth}
						height={CELL_HEIGHT_HALF}
					/>
				</View>
			</View>
		);
	}

	// 4+ images: 2×2 grid, max 4 visible cells, 4th shows overflow badge
	const overflowCount = count > 4 ? count - 4 : 0;
	const visibleFiles = files.slice(0, 4);

	return (
		<View
			style={[styles.galleryContainer, { width: containerWidth, height: GALLERY_HEIGHT, flexWrap: 'wrap', gap: GAP }]}
			onLayout={ev => setContainerWidth(Math.floor(ev.nativeEvent.layout.width))}>
			{visibleFiles.map((file, index) => (
				<ImageGalleryItem
					key={`${index}-${file.image_url}`}
					file={file}
					author={author}
					showAttachment={showAttachment}
					getCustomEmoji={getCustomEmoji}
					width={cellWidth}
					height={CELL_HEIGHT_HALF}
					overflowCount={index === 3 ? overflowCount : 0}
				/>
			))}
		</View>
	);
};

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;

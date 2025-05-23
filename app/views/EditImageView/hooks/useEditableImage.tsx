import { ImageResult } from 'expo-image-manipulator';
import { useState } from 'react';

interface IUseEditableImageProps {
	attachments: any[];
}

const useEditableImage = ({ attachments }: IUseEditableImageProps) => {
	const firstImage = attachments[0];
	const [images, setImages] = useState(attachments);
	const [editableImage, setEditableImage] = useState(firstImage);
	const [originalImageSize, setOriginalImageSize] = useState<any>({ width: firstImage?.width, height: firstImage?.height });

	const selectImageToEdit = (image: any) => {
		setEditableImage(image);
		setOriginalImageSize({ width: image.width, height: image.height });
	};

	const updateImage = (image: ImageResult) => {
		setEditableImage({ ...editableImage, width: image.width, height: image.height, path: image.uri });
		setImages(
			images.map(item =>
				item.filename === editableImage.filename
					? { ...editableImage, width: image.width, height: image.height, path: image.uri }
					: item
			)
		);
	};
	const updateOriginaImageSize = (updatedOriginalImageSize: { width: number; height: number }) => {
		setOriginalImageSize(updatedOriginalImageSize);
	};

	return {
		images,
		selectImageToEdit,
		editableImage,
		originalImageSize,
		updateOriginalImageSize: setOriginalImageSize,
		updateImage,
		updateOriginaImageSize
	};
};

export default useEditableImage;

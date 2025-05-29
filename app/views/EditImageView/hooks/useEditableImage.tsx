import { useState } from 'react';
import { ImageResult } from 'expo-image-manipulator';

interface IUseEditableImageProps {
	attachments: any[];
}

const useEditableImage = ({ attachments }: IUseEditableImageProps) => {
	const firstImage = attachments[0];
	const [images, setImages] = useState(attachments);
	const [editableImage, setEditableImage] = useState(firstImage);
	const [defaultImageSize, setDefaultImageSize] = useState<any>({ width: firstImage?.width, height: firstImage?.height });

	const selectImageToEdit = (image: any) => {
		setEditableImage(image);
		setDefaultImageSize({ width: image.width, height: image.height });
	};

	const updateImage = (image: ImageResult | any) => {
		setEditableImage({ ...editableImage, width: image.width, height: image.height, path: image.uri ?? image?.path });

		setDefaultImageSize({
			width: image.width,
			height: image.height
		});

		setImages(
			images.map(item =>
				item.filename === editableImage.filename
					? { ...editableImage, width: image.width, height: image.height, path: image.uri ?? image?.path }
					: item
			)
		);
	};

	const updateEditableImage = (updatedEditableImage: any) => {
		setEditableImage(updatedEditableImage);
		const imagesUpdated = images.map(item =>
			item.filename === updatedEditableImage.filename
				? {
						...updatedEditableImage,
						width: updatedEditableImage.width,
						height: updatedEditableImage.height,
						path: updatedEditableImage.uri ?? updatedEditableImage.path
				  }
				: item
		);
		setImages(imagesUpdated);
	};

	return {
		images,
		selectImageToEdit,
		editableImage,
		defaultImageSize,
		updateImage,
		editableImageIsPortrait: editableImage.height > editableImage.width,
		updateEditableImage
	};
};

export default useEditableImage;

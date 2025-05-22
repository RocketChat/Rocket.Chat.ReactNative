import { useState } from 'react';

interface IUseEditableImageProps {
	attachments: any[];
}

const useEditableImage = ({ attachments }: IUseEditableImageProps) => {
	const firstImage = attachments[0];

	const [images, setImages] = useState(attachments);
	const [editableImage, setEditableImage] = useState(firstImage?.image_url ?? '');
	const [originalImageSize, setOriginalImageSize] = useState<any>({ width: firstImage?.width, height: firstImage?.height });

	const selectImageToEdit = (image: any) => {
		setEditableImage(image);
	};

	const updateImage = (image: any) => {};
	const updateOriginaImageSize = (image: any) => {};
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

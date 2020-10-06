import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import ImageContainer from './Image';

const ImagePreview = React.memo(({ msg, showAttachment, theme }) => {
	const [previewImage, setPreviewImage] = useState();

	useEffect(() => {
		const firstImgMatch = msg.match(/(https?:\/\/.*\.(?:png|jpg))/);

		if (firstImgMatch) {
			const imgUrl = firstImgMatch[0];
			fetch(imgUrl).then(({ status }) => {
				if (status === 200) {
					setPreviewImage(imgUrl);
				}
			});
		}
	}, []);

	return previewImage && (
		<ImageContainer
			file={{ image_url: previewImage }}
			imageUrl={previewImage}
			showAttachment={showAttachment}
			theme={theme}
		/>
	);
});

ImagePreview.propTypes = {
	msg: PropTypes.string,
	theme: PropTypes.string,
	showAttachment: PropTypes.func
};

export default ImagePreview;

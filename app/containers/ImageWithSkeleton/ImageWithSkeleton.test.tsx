import React from 'react';
import { render } from '@testing-library/react-native';
import { act } from 'react-test-renderer';

import ImageWithSkeleton from '.';

const dummyBorderColor = '#808080';
const dummyURI = 'https://my.image/uri.png';
const testProps = {
	style: { borderColor: dummyBorderColor },
	source: { uri: dummyURI }
};

describe('ImageWithSkeleton', () => {
	it('should display/hide skeleton and image based on loading status', async () => {
		const { getByTestId, queryByTestId } = render(<ImageWithSkeleton {...testProps} />);

		const imageWithSkeleton = await getByTestId('image-with-skeleton');

		// Check that skeleton is displayed:
		const skeleton = await getByTestId('image-with-skeleton-skeleton');
		expect(skeleton).toBeTruthy();

		// Check that the props were passed down to <FastImage /> component:
		const fastImage = imageWithSkeleton.children[1] as any;
		const { style, source } = fastImage.props;
		expect(style[1].borderColor).toStrictEqual(dummyBorderColor);
		expect(source.uri).toStrictEqual(dummyURI);

		// Check that FastImage is hidden:
		expect(style[0]).toEqual({ display: 'none' });

		// Trigger image load:
		act(() => {
			fastImage.props.onLoadEnd();
		});

		// Check that skeleton is no longer displayed:
		const skeletons = await queryByTestId('image-with-skeleton-skeleton');
		expect(skeletons).toBeNull();

		// Check that FastImage is displayed:
		expect(fastImage.props.style[0]).toEqual({ display: 'flex' });
	});

	it('should display error message when image failed to load', async () => {
		const { getByTestId, queryByTestId, getByText, queryByText } = render(<ImageWithSkeleton {...testProps} />);

		const imageWithSkeleton = await getByTestId('image-with-skeleton');
		const fastImage = imageWithSkeleton.children[1] as any;

		// Check that error message is not displayed:
		const errorMessages = await queryByText("Can't display image.");
		expect(errorMessages).toBeNull();

		// Trigger load error:
		console.log(fastImage.props);
		act(() => {
			fastImage.props.onError();
		});

		// Check that skeleton is not displayed:
		const skeletons = await queryByTestId('image-with-skeleton-skeleton');
		expect(skeletons).toBeNull();

		// Check that FastImage is not displayed:
		expect(fastImage.props.style[0]).toEqual({ display: 'none' });

		// Check that error message is displayed:
		const errorMessage = await getByText("Can't display image.");
		expect(errorMessage).toBeTruthy();
	});
});

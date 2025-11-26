import React from 'react';
import { render } from '@testing-library/react-native';

import Skeleton from '../index';

// Mock useTheme
jest.mock('../../theme', () => ({
    useTheme: () => ({ colors: { surfaceTint: 'gray', surfaceHover: 'lightgray' } })
}));

jest.mock('react-native-skeleton-placeholder', () => {
    const { View } = require('react-native');
    const MockSkeleton = ({ children }: any) => <View testID="skeleton-placeholder">{children}</View>;
    MockSkeleton.Item = ({ children }: any) => <View testID="skeleton-item">{children}</View>;
    return MockSkeleton;
});

describe('Skeleton', () => {
    it('renders correctly', () => {
        const { toJSON } = render(<Skeleton width={100} height={100} />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('applies styles correctly', () => {
        const { toJSON } = render(<Skeleton width={50} height={50} borderRadius={10} />);
        expect(toJSON()).toMatchSnapshot();
    });
});

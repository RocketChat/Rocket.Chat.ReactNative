import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { type DimensionValue } from 'react-native';

import { useTheme } from '../../theme';

interface ISkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: object;
}

const Skeleton = ({ width, height, borderRadius, style }: ISkeletonProps): React.ReactElement => {
    const { colors } = useTheme();

    return (
        <SkeletonPlaceholder backgroundColor={colors.surfaceTint}>
            <SkeletonPlaceholder.Item width={width} height={height} borderRadius={borderRadius} {...style} />
        </SkeletonPlaceholder>
    );
};

export default Skeleton;

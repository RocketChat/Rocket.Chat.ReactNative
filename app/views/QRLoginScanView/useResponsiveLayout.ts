import { useWindowDimensions } from 'react-native';

export const useResponsiveScannerSize = () => {
    const { width } = useWindowDimensions();
    return Math.min(width * 0.75, 280);
};

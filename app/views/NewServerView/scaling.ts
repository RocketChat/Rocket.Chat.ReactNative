import { isTablet } from '../../lib/methods/helpers';

const guidelineBaseWidth = isTablet ? 600 : 375;
const guidelineBaseHeight = isTablet ? 800 : 667;

function scale({ size, width }: { size: number; width: number }): number {
	return (width / guidelineBaseWidth) * size;
}
function verticalScale({ size, height }: { size: number; height: number }): number {
	return (height / guidelineBaseHeight) * size;
}
function moderateScale({ size, factor = 0.5, width }: { size: number; factor?: number; width: number }): number {
	return size + (scale({ size, width }) - size) * factor;
}

export { scale, verticalScale, moderateScale };

import { isTablet } from './deviceInfo';

const guidelineBaseWidth = isTablet ? 600 : 375;
const guidelineBaseHeight = isTablet ? 800 : 667;

// TODO: we need to refactor this
const scale = (size, width) => (width / guidelineBaseWidth) * size;
const verticalScale = (size, height) => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5, width) => size + (scale(size, width) - size) * factor;

export { scale, verticalScale, moderateScale };

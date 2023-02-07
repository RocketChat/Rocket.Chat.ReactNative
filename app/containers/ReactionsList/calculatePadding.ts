const HEADER_HEIGHT = 48;
/**
 * This SNAP_PERCENTAGE is calculate between the snaps: ['50%', '80%']
 * so considering the content size is set to 80% and the first snap is 50%
 * we need to 50% * 80% = 40%
 */
const SNAP_PERCENTAGE = 0.4;
/**
 * This function is required for the ReactionsList to see the full list and the scroll enables,
 * because there are two snaps 50% and 80%, and the content size of the flatlist is measured by the 80%,
 * for either snaps and the header height is the height of the first line of the list.
 * @param height
 * @returns
 */
export const calculatePadding = (height: number) => height * SNAP_PERCENTAGE - HEADER_HEIGHT;

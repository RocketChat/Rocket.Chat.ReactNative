/**
 * Converts a block value to a stable string for use in React keys.
 * Handles strings, objects with .value property, arrays, and other types.
 * @param v - The value to convert
 * @returns A string representation suitable for key generation
 */

const getBlockValueString = (v: any): string => {
	if (v === null || v === undefined) return 'null';
	if (v === '') return 'empty';
	if (v === 0 || v === false) return String(v);

	if (typeof v === 'string') return v;
	if (typeof v?.value === 'string') return v.value;
	if (Array.isArray(v)) return v.map(getBlockValueString).join('-');

	return JSON.stringify(v).slice(0, 50);
};
export default getBlockValueString;

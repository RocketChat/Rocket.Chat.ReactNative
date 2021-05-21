/**
 * Function that filter asynchronous condition
 * @param {Values[]} arr
 * @param {(value)=> boolean} conditional
 * @returns Array
 */
const asyncFilter = async(arr, conditional) => {
	const results = await Promise.all(arr.map(conditional));

	return arr.filter((_v, index) => results[index]);
};

export default asyncFilter;

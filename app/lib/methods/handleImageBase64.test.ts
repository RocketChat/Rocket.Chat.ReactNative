import { isImageBase64 } from './isImageBase64';

// We aren't testing the content, only the header
const base64 =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKkAAADcCAIAAACEWBYKAAAAA3NCSVQICAjb4U/gAAAgAElEQVR4nO29aZAc13WoeXOtrMza967qHd1ooAGRBLQNTcnUxmHMmPo3CjvGEdZo7PAP/fDzs2fscbw/Hr14EYrwNhMeWZbMkCY0YZJiaB4FkwxRFkiAIgACDZAAutFbVXft+55Vua/z40g9EJaWWN0Al8rvR0d1Va735M177jnnnoPZto0cxhL8/b4Ah/cNR/bjiyP78cWR/fjiyH58cWQ/vjiyH18c2Y8vjuzHF0f244sj+/HFkf344sh+fHFkP76MLntLkg/xOhwePiPK3pKV0vLTpf/+fxy8fp4/e07e2PpN9lJ3c3d+s5P9lcOKkt5q37GN3myZojjadTrsw4iyx90M8z8';

describe('Test the isImageBase64', () => {
	it.each([
		['test', false],
		['/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png', false],
		[base64, true]
	])('return properly the boolean', (data, res) => {
		const result = isImageBase64(data);
		expect(result).toBe(res);
	});
});

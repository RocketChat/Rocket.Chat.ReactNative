import { ApiResponse } from '../../definitions';

export const fetchData = async (userId: string | undefined, is_hot: number): Promise<ApiResponse> => {
  if (userId == undefined) {
    userId = '';
  }
const response = await fetch(`https://m.jujiaxi.com/interface?{"action":"getAction","method":"get",
"param":{"format":"json","needAll":"1","param":{"user_id":"","${is_hot}":"1"},"serviceName":"Open_screen_main"}}`);
if (!response.ok) {
      console.error(`Failed to fetch data. Status code: ${response.status}`);
}

const data = await response.json();
console.log(data);

return data;
};

// const fetchData = async (userId: string): Promise<ApiResponse> => {
//     const url = `https://example.com/api/data?userId=${userId}`;
  
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
  
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
  
//     return response.json();
//   };
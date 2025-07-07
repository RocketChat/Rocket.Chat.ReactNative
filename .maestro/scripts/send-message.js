// Replace the values below with the actual values for your server
function postMessage() {
  const url = 'https://HOST/api/v1/chat.postMessage';
  const response = http.post(url, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-auth-token': 'TOKEN', 
      'x-user-id': 'USER_ID'
    },
    body: JSON.stringify(
      {
        roomId: "RID",
        text: msg
      }
    )
  });

  output.messageId = JSON.parse(response.body).message._id;

  return response.ok;
}

postMessage();
// Replace the values below with the actual values for your server
function postMessage() {
  const url = 'https://' + host + '/api/v1/chat.postMessage';
  const response = http.post(url, {
    headers: { 
      'Content-Type': 'application/json', 
      'x-auth-token': token, 
      'x-user-id': userId
    },
    body: JSON.stringify(
      {
        roomId: rid,
        text: msg
      }
    )
  });

  console.log('response', response.body);

  output.messageId = JSON.parse(response.body).message._id;

  return response.ok;
}

postMessage();
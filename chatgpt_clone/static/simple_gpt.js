const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/gpt_local/');

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const message = data['message'];
    // create element
    const element = document.createElement('div');
    element.textContent = message;
    document.getElementById('conversation').appendChild(element);
};

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

// Send message to server
function sendMessage() {
    const message = document.getElementById('message').value;
    chatSocket.send(JSON.stringify({
        'message': message
    }));
}
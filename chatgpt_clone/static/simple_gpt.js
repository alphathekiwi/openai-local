let current = 0;
const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/gpt_local/');
window.onbeforeunload = function(event) {
    chatSocket.close();
};

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    updateMessageElement(data['msg_id'], data['message']);
};

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

function sendMessage() {
    const message = document.getElementById('message').value;
    createMessageElement(current, message);
    createMessageElement(current+1, '', 'robot');
    chatSocket.send(JSON.stringify({
        'msg_id': current + 1,
        'message': message
    }));
    current += 2;
}

function createMessageElement(msg_id, message, role='human') {
    const element = document.createElement('div');
    element.textContent = message;
    element.dataset.role = role;
    element.dataset.msgId = msg_id;
    document.getElementById('conversation').appendChild(element);
}
function updateMessageElement(msg_id, message) {
    const element = document.querySelector(`[data-msg-id="${msg_id}"]`);
    const text = element.textContent
    element.textContent = text + message;
}
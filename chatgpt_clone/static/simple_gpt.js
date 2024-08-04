let current = 0, chatSocket = null;
let socket_url = 'ws://' + window.location.host + '/ws/gpt_local/';
const url_params = new URLSearchParams(window.location.search);
if (url_params.has('id')) {
    socket_url += '?id=' + url_params.get('id');
}
window.onbeforeunload = function(e) {
    if (chatSocket != null){ chatSocket.close(); }
};

chatSocket.onclose = function(e) {
    chatSocket = null;
};

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const msg_id = data['msg_id'], 
        message = data['message'], 
        complete = data['completed'] == true;
    let element = document.querySelector(`[data-msg-id="${data['msg_id']}"]`);
    if (element == null) { // create a new message element if it doesn't exist
        element = createMessageElement(msg_id);
    }
    if (msg_id >= current) { // increase the current message id if the message is from the history
        current = msg_id + 1;
    }
    if (msg_id % 2 == 1) { // format the message if it is from the LLM
        element.innerHTML = simpleMdpCodeBlocks(message);
    } else if (message != undefined && message != '') {
        element.textContent += message;
    }
    if (complete) { // if the message is the last one, enable the send button
        document.getElementById('send').disabled = false;
    }
};

function tryConnect() {
    try {
        chatSocket = new WebSocket(socket_url);
    } catch (error) {
        console.error('Failed to create a new WebSocket connection:', error);
        return true; // return true to indicate that the connection failed
    }
}

tryConnect();

function sendMessage() {
    if (chatSocket == null && tryConnect()) { return }
    const message = document.getElementById('message').value;
    document.getElementById('send').disabled = true;
    const prompt_msg = createMessageElement(current);
    prompt_msg.textContent = message;
    createMessageElement(current + 1);
    chatSocket.send(JSON.stringify({
        'msg_id': current + 1,
        'message': message
    }));
    current += 2;
}

function createMessageElement(msg_id, role=null) {
    if (role == null) {
        if (msg_id % 2 == 0) { role = 'human'; } else { role = 'robot'; }
    }
    const element = document.createElement('div');
    element.dataset.role = role;
    element.dataset.msgId = msg_id;
    document.getElementById('conversation').appendChild(element);
    return element;
}

// I did look for a markdown parser library but ultimately decided
// it would be more interesting to write my own
// Only some of the extended specs are supported.
// NOT SUPPORTED: tables, footnotes, emoji, definition lists, heading ids
//  TODO:  add support for tables
//  TODO:  add https://highlightjs.org/ for syntax highlighting in code blocks
//
//                IS CODE BLOCK:
//           YES                 NO
//            |                   |
//       no further         Run fullline items formatting
//       formatting               |
//                          IS INLINE CODE:
//                        YES             NO
//                         |               |
//                    no further       Runn inline items formatting


function simpleMdpCodeBlocks(text) {
    // For the code blocks, I took the approach of splitting the text into parts
    // based on the code block delimiters and since the code block delimiters are always open and close pairs
    // the even parts will be the non-code block parts and the odd parts will be the code block parts
    let parts = text.split(/```/g);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
            if (parts[i].length > 2) { // minor bug fixed here
                parts[i] = simpleMdpInlineCode(simpleMdpFulllineItems(parts[i]));
            }
        } else {
            if (/html/.test(parts[i])) {
                parts[i] = escapeHTML(parts[i]).replace(/^html/i, '<iframe seamless srcdoc="') + '"></iframe>';
            } else {
                parts[i] = parts[i].replace(/^(\w\n)?/i, '<code class="code $1">') + '</code>';
            }
        }
    }
    return parts.join('').replace(/([\deilr])>\n+/g, '$1>').replace(/([^>])\n+/g,'$1<br>');
}
function simpleMdpInlineCode(text) {
    // The inline code is a bit more complicated because I need to ensure that they never cross to the next line
    // As such I need to keep track of the indices of the code block delimiters and only add the code block tags
    // if the code block is not split by a newline character
    let pattern = /`/g;
    let indices = [0];
    while ((match = pattern.exec(text)) != null) {
        if (indices.length % 2 == 1 && /([^\n\r`])+`/.test(text.substring(match.index, text.length))) {
            indices.push(match.index); // only add the index if a newline char is not found
        } else if (indices.length % 2 == 0) {
            indices.push(match.index + 1); // if the start was added, add the end
        }
    }
    indices.push(text.length);
    let newText = '';
    for (let i = 0; i < indices.length; i+=2) {
        newText += simpleMdpInlineItems(text.substring(indices[i], indices[i+1]));
        if (i+2 < indices.length) { // there won't be a closing code block
            newText += '<code class="inline">' + text.substring(indices[i+1], indices[i+2]) + '</code>';
        }
    }
    return newText;
}
function simpleMdpFulllineItems(text) {
	return text.replace(/^# (.*)$/gm, '<h1>$1</h1>') // h1 tag
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')       // h2 tag
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')      // h3 tag
        .replace(/^#### (.*)$/gm, '<h4>$1</h4>')     // h4 tag
        .replace(/^##### (.*)$/gm, '<h4>$1</h5>')    // h5 tag
        .replace(/^###### (.*)$/gm, '<h4>$1</h6>')   // h6 tag
		.replace(/^(_{3}|-{3}|\*{3})$/gm, '<hr>')    // horizontal rule
        .replace(/^> *(.+)$/gm, '<blockquote>\n$1</blockquote>') // blockquote
        .replace(/<\/blockquote>\n?<blockquote>/gi, '<br>')      // merge adjacent blockquote items
        .replace(/^ *\- \[ \] (.*)$/gm, '<ul><li><input type="checkbox">$1</li></ul><br>')         // checkbox list
        .replace(/^ *\- \[x\] (.*)$/gm, '<ul><li><input type="checkbox" checked>$1</li></ul><br>') // checkbox list ticked
        .replace(/li><\/ul>(<br>)?\n?<ul><li/gi, 'li><li')                                         // merge adjacent check list items
        .replace(/^ *\- +(.*)$/gm, '<ul><li>$1</li></ul>') // bullet list
        .replace(/li><\/ul>(<br>)?\n?<ul><li/gi, 'li><li') // merge adjacent bullet list items
        .replace(/^ *(\d+)\. (.*)$/gm, '<ol><li value="$1">$2</li></ol>') // numbered list
        .replace(/li><\/ol>(<br>)?\n?<ol><li/gi, 'li><li');               // merge adjacent numbered list items
}
function simpleMdpInlineItems(text) {
    return text.replace(/~~([^~\n\r]+)~~/g, '<s>$1</s>') // strikethrough text
		.replace(/\*\*([^*\n\r]+)\*\*/g, '<b>$1</b>')    // bold text
		.replace(/\*([^*\n\r]+)\*/g, '<em>$1</em>')      // italic text
		.replace(/__([^_\n\r]+)__/g, '<b><i>$1</i></b>') // bold and italic text
		.replace(/_([^_\n\r]+)_/g, '<em>$1</em>')        // italic text
		.replace(/==([^=\n\r]+)==/g, '<mark>$1</mark>')  // highlighted text
		.replace(/\^([^\^\n\r]+)\^/g, '<sup>$1</sup>')   // superscript text
		.replace(/~([^~\n\r]+)~/g, '<sub>$1</sub>')      // subscript text
        .replace(/!\[([^\]\n\r]+)\]\(([^\)\n\r]+)\)/g, '<img src="$2" alt="$1"></img>') // images
        .replace(/\[([^\]\n\r]+)\]\(([^\)\n\r]+)\)/g, '<a href="$2">$1</a>')            // hyperlink
        .replace(/([^\("`>]) *?(http(s)?:\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi, '$1<a href="$2">$2</a>');
}
function escapeHTML(text) { 
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
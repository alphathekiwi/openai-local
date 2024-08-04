let current = 0;
const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/gpt_local/');
window.onbeforeunload = function(e) {
    chatSocket.close();
};

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const element = document.querySelector(`[data-msg-id="${data['msg_id']}"]`);
    if (data['completed'] == true) {
        element.innerHTML = simpleMdpCodeBlocks(element.textContent);
    } else {
        element.textContent += data['message'];
    }
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
    let parts = text.split(/```/g);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
            if (parts.length > 2) {
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
    console.log(text);
    console.log(indices);
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
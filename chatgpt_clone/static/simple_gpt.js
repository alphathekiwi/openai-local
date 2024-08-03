let current = 0;
const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/gpt_local/');
window.onbeforeunload = function(e) {
    chatSocket.close();
};

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const element = document.querySelector(`[data-msg-id="${data['msg_id']}"]`);
    if (data['completed'] == true) {
        element.innerHTML = simpleMarkdownCodeBlocksFirst(element.textContent);
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
function simpleMarkdownCodeBlocksFirst(text) {
    let parts = text.split(/```/g);
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 == 0) {
            if (parts.length > 2) {
                parts[i] = simpleMarkdownInlineCodeNext(parts[i]);
            }
        } else {
            if (/html/.test(parts[i])) {
                parts[i] = escapeHTML(parts[i]).replace(/^html/i, '<iframe seamless srcdoc="') + '"></iframe>';
            } else {
                parts[i] = parts[i].replace(/^(\w\n)?/i, '<code class="code $1">').replace(/\n/g,'<br>') + '</code>';
            }
        }
    }
    return parts.join('');
}
function simpleMarkdownInlineCodeNext(text) {
    let pattern = /`/g;
    let indices = [0];
    while ((match = pattern.exec(text)) != null) {
        if (indices.length % 2 == 1 && /[^\n\r`]+`/.test(text.substring(match.index, text.length))) {
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
        newText += simpleMarkdownParser(text.substring(indices[i], indices[i+1]));
        if (i+2 < indices.length) { // there won't be a closing code block
            newText += '<code class="inline">' + text.substring(indices[i+1], indices[i+2]) + '</code>';
        }
    }
    return newText;
}


function simpleMarkdownParser(text) {
    // I did look for a markdown parser library but ultimately decided
    // it would be more interesting to write my own
    // Only some of the extended specs are supported.
    // NOT SUPPORTED: tables, footnotes, emoji, definition lists, heading ids
    //  TODO:  add support for tables
    //  TODO:  add https://highlightjs.org/ for syntax highlighting in code blocks
	return text
		.replace(/^###### (.*)$/gim, '<h4>$1</h6>') // h6 tag
		.replace(/^##### (.*)$/gim, '<h4>$1</h5>')  // h5 tag
		.replace(/^#### (.*)$/gim, '<h4>$1</h4>')   // h4 tag
		.replace(/^### (.*)$/gim, '<h3>$1</h3>')    // h3 tag
		.replace(/^## (.*)$/gim, '<h2>$1</h2>')     // h2 tag
		.replace(/^# (.*)$/gim, '<h1>$1</h1>')      // h1 tag
        .replace(/^> *(.+)$/gim, '<blockquote>\n$1</blockquote>') // blockquote
        .replace(/<\/blockquote>\n?<blockquote>/gim, '<br>')      // merge adjacent blockquote items
        .replace(/^ *\- \[ \] (.*)$/gim, '<ul><li><input type="checkbox">$1</li></ul><br>')          // checkbox list
        .replace(/^ *\- \[x\] (.*)$/gim, '<ul><li><input type="checkbox" checked>$1</li></ul><br>')  // checkbox list ticked
        .replace(/<\/li><\/ul><br>\n?<ul><li>/gim, '</li><li>')                                      // merge adjacent check list items
        .replace(/^ *\- +(.*)$/gim, '<ul><li>$1</li></ul>')     // bullet list
        .replace(/<\/li><\/ul>\n?<ul><li>/gim, '</li><li>')     // merge adjacent bullet list items
        .replace(/^ *(\d+)\. (.*)$/gim, '<ol><li value="$1">$2</li></ol>') // numbered list
        .replace(/<\/li><\/ol>\n?<ol><li/gim, '</li><li')                  // merge adjacent numbered list items
		.replace(/^(_{3}|-{3}|\*{3})$/gim, '<hr>')         // horizontal rule
		.replace(/~~([^~\n\r]+)~~/gim, '<s>$1</s>')        // strikethrough text
		.replace(/\*\*([^*\n\r]+)\*\*/gim, '<b>$1</b>')    // bold text
		.replace(/\*([^*\n\r]+)\*/gim, '<em>$1</em>')      // italic text
		.replace(/__([^_\n\r]+)__/gim, '<b><i>$1</i></b>') // bold and italic text
		.replace(/_([^_\n\r]+)_/gim, '<i>$1</i>')          // italic text
		.replace(/==([^=\n\r]+)==/gim, '<mark>$1</mark>')  // highlighted text
		.replace(/\^([^\^\n\r]+)\^/gim, '<sup>$1</sup>')   // superscript text
		.replace(/~([^~\n\r]+)~/gim, '<sub>$1</sub>')      // subscript text
        .replace(/!\[([^\]\n\r]+)\]\(([^\)\n\r]+)\)/gim, '<img src="$2" alt="$1"></img>') // images
        .replace(/\[([^\]\n\r]+)\]\(([^\)\n\r]+)\)/gim, '<a href="$2">$1</a>')            // hyperlink
        .replace(/\n$/gim, '<br>'); // line break
}

function escapeHTML(text) { 
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
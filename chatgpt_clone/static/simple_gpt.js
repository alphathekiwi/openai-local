let current = 0;
const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/gpt_local/');
window.onbeforeunload = function(e) {
    chatSocket.close();
};

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const element = document.querySelector(`[data-msg-id="${data['msg_id']}"]`);
    if (data['completed'] == true) {
        element.innerHTML = simpleMarkdownParser(element.textContent);
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

function simpleMarkdownParser(text) {
    // I did look for a markdown parser library but ultimately decided
    // it would be more interesting to write my own
    // Only some of the extended specs are supported.
    // NOT SUPPORTED: tables, footnotes, emoji, definition lists, heading ids
    //  TODO:  add support for tables
    //  TODO:  add https://highlightjs.org/ for syntax highlighting in code blocks
	const toHTML = text
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
		.replace(/`([^`\n\r]+)`/gim, '<code class="inline">$1</code>')       // inline code
        .replace(/```html([^`]+)```/gim, '<iframe seamless>$1</iframe>')     // html block
        .replace(/```(\w*)([^`]+)```/gim, '<code class="code $1">$2</code>') // code block
        .replace(/!\[([^\]\n\r]+)\]\(([^\)\n\r]+)\)/gim, '<img src="$2" alt="$1"></img>') // images
        .replace(/\[([^\]\n\r]+)\]\(([^\)\n\r]+)\)/gim, '<a href="$2">$1</a>')            // hyperlink
        .replace(/\n$/gim, '<br>'); // line break
	return toHTML.trim();
}
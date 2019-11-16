// ﻿(function() {
// 	console.log('content.js loaded');
// })();

chrome.storage.sync.get('state', function(data) {
	if (data.state === 'on') {
		enableListener();
	} else {
		// disableListener();
	}
});

var enabled;

function enableListener() {
	enabled = true;
	document.addEventListener('input', e => {
		enabled && isTextField(e.target) && processTextField(e.target);
	});
}

function disableListener() {
	enabled = false;
	// document.removeEventListener('input', e => {
	// 	isTextField(e.target) && processTextField(e.target);
	// });
}


chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

  if (msg.action == 'enableListener') {
		enableListener();
  }
	if (msg.action == 'disableListener') {
		disableListener();
	}
});


var isTextField = function (elem) {
  return !!(elem.tagName.toUpperCase() === 'TEXTAREA'
      || elem.isContentEditable
      || (elem.tagName.toUpperCase() === 'INPUT'
          && elem.type.toUpperCase() === 'TEXT'));
};

var charsTillEndOfStr = function (activeElement) {
  return getValue(activeElement).length - getSelectionStart(activeElement);
};

var correctCaretPosition = function (activeElement, charsTillEndOfStr) {
  var correctCaretPos = getValue(activeElement).length - charsTillEndOfStr;
  setSelection(activeElement, correctCaretPos);
  return correctCaretPos;
};

var processTextField = function (activeElement) {
  var charsTillEnfOfStrBeforeRegex = charsTillEndOfStr(activeElement);
  setValue(activeElement, replaceTypewriterPunctuation(getValue(activeElement)));
  correctCaretPosition(activeElement, charsTillEnfOfStrBeforeRegex);
  return getValue(activeElement);
};

var replaceTypewriterPunctuation = function (g) {
  var splitterRegex = /(?:```[\S\s]*?(?:```|$))|(?:`[\S\s]*?(?:`|$))|(?:\{code(?:\:.*?)?\}[\S\s]*?(?:\{code\}|$))|(?:\{noformat\}[\S\s]*?(?:\{noformat\}|$))/gi;
  var f = false,
      d = "",
      h = g.split(splitterRegex);
  if (h.length === 1) {
    d = regex(g);
  } else {
    var a = g.match(splitterRegex);
    if (!h[0]) {
      h.shift();
      f = true;
    }
    for (var b = 0; b < h.length; ++b) {
      var c = regex(h[b]);
      if (f) {
        d += a[b] != null ? a[b] + c : c;
      } else {
        d += a[b] != null ? c + a[b] : c;
      }
    }
  }
  return d;
};

var regex = function (g) {
  return g
  .replace(new RegExp('(\\s|^|\\(|\\>|\\])(\")(?=[^>\\]]*(<|\\[|$))', 'g'), "$1“")
  .replace(new RegExp("(\\s|^|\\(|\\>|\\])(')(?=[^>\\]]*(<|\\[|$))", 'g'), "$1‘")
  .replace(new RegExp('(.)(\")(?=[^>\\]]*(<|\\[|$))', 'g'), "$1”")
  .replace(new RegExp("(.)(')(?=[^>\\]]*(<|\\[|$))", 'g'), "$1’")
  .replace(/(\w|\s)-{3}(\w|\s)/g, "$1—$2")
  .replace(/(\w|\s)-{2}(\w|\s)/g, "$1–$2")
  .replace(/(\w|\s)–-(\w|\s)/g, "$1—$2")
  .replace(/([^.…])\.{3}([^.…])/g, "$1…$2")

  // shortenings whitelist
  // .replace(/‘([0-9]{2}s?)/gi, "’$1")
  .replace(/([0-9]s?)’/gi, "$1'")
  .replace(/([0-9]s?)”/gi, '$1"')
  .replace(/‘(em)/gi, "’$1")
  .replace(/‘(twas)/gi, "’$1")
  .replace(/‘(cause)/gi, "’$1")
  .replace(/‘(n)/gi, "’$1")

	//additional replacements

	.replace("^2", "\xB2")
	.replace("^3", "\xB3")
	.replace("1/2", "\xBD")
	.replace("1/3", "\x2153")
	.replace("1/4", "\xBC")
	.replace("2/3", "\x2154")

	.replace("_A", "𝐴")
	.replace("_B", "𝐵")
	.replace("_C", "𝐶")

	.replace("_a", "𝑎")
	.replace("_b", "𝑏")
	.replace("_c", "𝑐")

	.replace("_X", "𝑋")
	.replace("_Y", "𝑌")
	.replace("_Z", "𝑍")

	.replace("_x", "𝑥")
	.replace("_y", "𝑦")
	.replace("_z", "𝑧")

	.replace("~~", "\u2248")
	.replace("/=", "\u2260")

	.replace("<=", "\u2264")
	.replace(">=", "\u2265")

	.replace(">>", "\xBB")
	.replace("<<", "\xAB")

	.replace("^deg", "\xB0")
	// .replace("^tm", "™")
	.replace("^tm", "\u2122")

	.replace("*x", "\xD7")

	// .replace("<->", "↔")
	.replace("->", "\u2192")
	.replace("<-", "\u2190")

	.replace(" .", ".")
	// .replace("“*", "❝")
	// .replace("*”", "❞")

	// .replace("!!", "‼")
	// .replace("?!", "⁈")
	// .replace("!?", "⁉")

	.replace("* ", "\u2022 ")
	.replace("**", "\u2731")

	.replace("c/o", "\u2105")
	.replace("numero", "\u2116")

	.replace("(R)", "\xAE")
	.replace("(C)", "\xA9")

	.replace(/ +(?= )/g,'');

};

var getValue = function (activeElement) {
  if (activeElement.isContentEditable) {
    return document.getSelection().anchorNode.textContent;
  }
  return activeElement.value;
};

var setValue = function (activeElement, newValue) {
  if (activeElement.isContentEditable) {
    var sel = document.getSelection();

    if (!isTextNode(sel.anchorNode)) {
      return;
    }

    return sel.anchorNode.textContent = newValue;
  }
  return activeElement.value = newValue;
};

var getSelectionStart = function (activeElement) {
  if (activeElement.isContentEditable) {
    return document.getSelection().anchorOffset;
  }
  return activeElement.selectionStart;
};

var setSelection = function (activeElement, correctCaretPos) {
  if (activeElement.isContentEditable) {
    var range = document.createRange();
    var sel = window.getSelection();

    if (!isTextNode(sel.anchorNode)) {
      var textNode = document.createTextNode("");
      sel.anchorNode.insertBefore(textNode, sel.anchorNode.childNodes[0]);
      range.setStart(textNode, 0);
    } else {
      range.setStart(sel.anchorNode, correctCaretPos);
    }

    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return;
  }

  activeElement.selectionStart = correctCaretPos;
  activeElement.selectionEnd = correctCaretPos;
};

var isTextNode = function (node) {
  return node.nodeType === 3;
};

// document.addEventListener('input', e => {
//   isTextField(e.target) && processTextField(e.target);
// });

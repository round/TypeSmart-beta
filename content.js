// (function() {
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

var easyReplacements = {
	"^2": "\xB2",
	"^3": "\xB3",
	"1/2": "\xBD",
	"1/3": "\u2153",
	"1/4": "\xBC",
	"2/3": "\u2154",

	"_A": "𝐴",
	"_B": "𝐵",
	"_C": "𝐶",

	"_a": "𝑎",
	"_b": "𝑏",
	"_c": "𝑐",

	"_X": "𝑋",
	"_Y": "𝑌",
	"_Z": "𝑍",

	"_x": "𝑥",
	"_y": "𝑦",
	"_z": "𝑧",

	"~~": "\u2248",
	"/=": "\u2260",

	"<=": "\u2264",
	">=": "\u2265",

	">>": "\xBB",
	"<<": "\xAB",

	"^deg": "\xB0",
	"^tm": "\u2122",

	"*x": "\xD7",
	"->": "\u2192",
	"<-": "\u2190",

	" .": ".",

	"*** ": "\u2731",
	"** ": "\u273D",
	"* ": "\u2022 ",

	"c/o": "\u2105",
	"numero": "\u2116",
	// "shrug" : "¯\\_(ツ)_/¯",

	"(r)": "\xAE",
	"(c)": "\xA9"
}
var fastRegiPattern;

/** Escaping easy replacement keys for safe usage in regex **/
var escapeRegExp = function(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/** single regular expression for simple replacements **/
var fastRegi  = function () {
  if (fastRegiPattern) return fastRegiPattern;

  const regString = Object.keys(easyReplacements).map(escapeRegExp).join('|')
  fastRegiPattern = new RegExp(regString, 'gi')

  // rudimentary support for case-insensitivity
  for (key in easyReplacements) {
    if (key.charAt(0) == "_") return;
    easyReplacements[key.toUpperCase()] = easyReplacements[key]
  }
  return fastRegiPattern;
}

/** processor function for the single regex for simple replacements **/
var fastReplacements = function(el) {
  if (el in easyReplacements) {
    return easyReplacements[el];
  }
}

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
  .replace(/(\w|\s)-{3}(\w|\s)/g, "$1\u2014$2") // em dash
  .replace(/(\w|\s)-{2}(\w|\s)/g, "$1\u2013$2") // en dash
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
   .replace(fastRegi(), fastReplacements);

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

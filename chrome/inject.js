var ArrayProto = Array.prototype;
var HIGHLIGHT_WRAPPER_CLASS = '__highlight_wrapper__';
var HIGHLIGHT_CLASS = '__highlight__';
var HIGHLIGHT_CURRENT_CLASS = '__highlight_current__';
var nodes = [];

function walk(rootNode, text) {
	ArrayProto.forEach.call(rootNode.childNodes, function (node) {
		if (node.nodeType === 3 && node.nodeValue.indexOf(text) >= 0) {
			nodes.push(node);
		} else if (node.childNodes.length > 0) {
			walk(node, text);
		}
	});
}

function hightlight(text) {
	walk(document.querySelector('.blob-wrapper'), text);

	nodes.forEach(function (node) {
		var parentNode = node.parentNode;

		var tmp = document.createElement('div');
		tmp.innerHTML = '<span class="' + HIGHLIGHT_WRAPPER_CLASS + '">' + node.nodeValue.replace(new RegExp('(' + text.replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')', 'g'), '<span class="' + HIGHLIGHT_CLASS + '">$1</span>') + '</span>';

		while (tmp.firstChild) {
			parentNode.insertBefore(tmp.firstChild, node);
		}

		parentNode.removeChild(node);
	});

	nodes = [];
}

function cancelHighLight() {
	var hightlightWrappers = document.querySelectorAll('.' + HIGHLIGHT_WRAPPER_CLASS);

	ArrayProto.forEach.call(hightlightWrappers, function (wrapper) {
		var parentNode = wrapper.parentNode;

		var text = wrapper.textContent;
		var tmp = document.createElement('div');
		tmp.innerHTML = text;

		while (tmp.firstChild) {
			parentNode.insertBefore(tmp.firstChild, wrapper);
		}

		parentNode.removeChild(wrapper);
	});
}

function injectCss(cssContent) {
	var stylesheet = document.createElement('style');
	stylesheet.type = 'text/css';
	stylesheet.textContent = cssContent;
	document.head.appendChild(stylesheet);
}

function centerOffset(elm) {
	var rect = elm.getBoundingClientRect();

	return {
		top: rect.top + document.body.scrollTop + (elm.offsetHeight / 2),
		left: rect.left + document.body.scrollLeft + (elm.offsetWidth / 2),
	};
}

function findNearestHighlightNode(top, left) {
	var elms,
		distances,
		minDistance;

	elms = ArrayProto.slice.call(document.querySelectorAll('.' + HIGHLIGHT_CLASS));
	distances = [];

	elms.forEach(function (v) {
		var o = centerOffset(v) || {};
		var t = o.top || -10000;
		var l = o.left || -10000;
		var d = Math.pow(top - t, 2) + Math.pow(left - l, 2);
		distances.push(d);
	});

	minDistance = Math.min.apply(Math, distances);

	return elms[distances.indexOf(minDistance)];
}

document.addEventListener('mouseup', function (e) {
	var words,
		current;

	words = window.getSelection().toString().trim();

	if (e.button === 2 || words === '') {
		return;
	}

	cancelHighLight();
	hightlight(words);

	current = findNearestHighlightNode(e.pageY, e.pageX);

	// shall call insertCss
	injectCss('.' + HIGHLIGHT_CLASS + '{background-color: #FF0;} .' + HIGHLIGHT_CURRENT_CLASS + '::selection{background-color: #FF9632;}');

	// set selection
	if (current) {
		current.classList.add(HIGHLIGHT_CURRENT_CLASS);

		var range = document.createRange();
		range.selectNodeContents(current);

		var selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);

		current.offsetHeight = current.offsetHeight;
	}
}, false);

document.addEventListener('keydown', function onKeyDown(e) {
	// ESC
	if (e.keyCode === 27) {
		cancelHighLight();
	}
}, false);

/* global findAndReplaceDOMText */

var HIGHLIGHT_CLASS = '__highlight__';
var HIGHLIGHT_CURRENT_CLASS = '__highlight_current__';

injectCss( '.' + HIGHLIGHT_CLASS + '{background-color: #FF0;} .' + HIGHLIGHT_CURRENT_CLASS + '::selection{background-color: #FF9632;}' );

var lastHighlighted;

function hightlight( text ) {
	const $container = document.querySelector( '.blob-wrapper' );
	return findAndReplaceDOMText( $container, {
		find: text,
		wrap: 'span',
		wrapClass: HIGHLIGHT_CLASS,
	} );
}

function cancelHighLight() {
	if ( lastHighlighted && lastHighlighted.revert ) {
		lastHighlighted.revert();
	}
}

function injectCss( cssContent ) {
	const stylesheet = document.createElement( 'style' );
	stylesheet.type = 'text/css';
	stylesheet.textContent = cssContent;
	document.head.appendChild( stylesheet );
}

function centerOffset( elm ) {
	const rect = elm.getBoundingClientRect();

	return {
		top: rect.top + document.body.scrollTop + ( elm.offsetHeight / 2 ),
		left: rect.left + document.body.scrollLeft + ( elm.offsetWidth / 2 ),
	};
}

function findNearestHighlightNode( top, left, text ) {
	const elms = [].slice.call(
			document.querySelectorAll( '.' + HIGHLIGHT_CLASS )
		)
		.filter( function ( node ) {
			return node.textContent === text;
		} );

	if ( elms.length === 0 ) {
		return;
	}

	const distances = [];

	elms.forEach( function ( v ) {
		var o = centerOffset( v ) || {};
		var t = o.top || -10000;
		var l = o.left || -10000;
		var d = Math.pow( top - t, 2 ) + Math.pow( left - l, 2 );
		distances.push( d );
	} );

	const minDistance = Math.min.apply( Math, distances );

	return elms[ distances.indexOf( minDistance ) ];
}

document.addEventListener( 'mouseup', function ( e ) {
	const words = window.getSelection().toString().trim();

	if ( e.button === 2 || words === '' ) {
		return;
	}

	const savedSelection = saveSelection( document.querySelector( '.blob-wrapper' ) );

	cancelHighLight();

	lastHighlighted = hightlight( words );

	const current = findNearestHighlightNode( e.pageY, e.pageX, words );

	// set selection
	if ( current ) {
		const range = document.createRange();
		current.classList.add( HIGHLIGHT_CURRENT_CLASS );
		range.selectNodeContents( current );

		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange( range );
	} else {
		restoreSelection( document.querySelector( '.blob-wrapper' ), savedSelection );
	}
}, false );

document.addEventListener( 'keydown', function onKeyDown( e ) {
	// ESC
	if ( e.keyCode === 27 ) {
		cancelHighLight();
	}
}, false );

// http://stackoverflow.com/questions/17678843/cant-restore-selection-after-html-modify-even-if-its-the-same-html
function saveSelection( containerEl ) {
	var doc = containerEl.ownerDocument,
		win = doc.defaultView;
	var range = win.getSelection().getRangeAt( 0 );
	var preSelectionRange = range.cloneRange();
	preSelectionRange.selectNodeContents( containerEl );
	preSelectionRange.setEnd( range.startContainer, range.startOffset );
	var start = preSelectionRange.toString().length;

	return {
		start: start,
		end: start + range.toString().length
	};
}

function restoreSelection( containerEl, savedSel ) {
	var doc = containerEl.ownerDocument,
		win = doc.defaultView;
	var charIndex = 0,
		range = doc.createRange();
	range.setStart( containerEl, 0 );
	range.collapse( true );
	var nodeStack = [ containerEl ],
		node,
		foundStart = false,
		stop = false;

	while ( !stop && ( node = nodeStack.pop() ) ) {
		if ( node.nodeType === 3 ) {
			var nextCharIndex = charIndex + node.length;
			if ( !foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex ) {
				range.setStart( node, savedSel.start - charIndex );
				foundStart = true;
			}
			if ( foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex ) {
				range.setEnd( node, savedSel.end - charIndex );
				stop = true;
			}
			charIndex = nextCharIndex;
		} else {
			var i = node.childNodes.length;
			while ( i-- ) {
				nodeStack.push( node.childNodes[ i ] );
			}
		}
	}

	var sel = win.getSelection();
	sel.removeAllRanges();
	sel.addRange( range );
}

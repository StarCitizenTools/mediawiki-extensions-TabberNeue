/**
 * Utility class with methods for common utility functions.
 *
 * @class Util
 */
class Util {
	/**
	 * Extracts text content from the given HTML string.
	 *
	 * @param {string} html - The HTML string to extract text content from.
	 * @return {string} The extracted text content.
	 */
	static extractTextFromHtml( html ) {
		const tmp = document.createElement( 'div' );
		tmp.innerHTML = html;
		return tmp.textContent;
	}

	/**
	 * Returns the size (width or height) of the provided element.
	 * Required to calculate the size of hidden elements (e.g. nested tabs)
	 *
	 * @param {Element} element - The element for which to get the size.
	 * @param {string} type - The type of size to retrieve ('width' or 'height').
	 * @return {number} The actual size of the element based on the specified type.
	 */
	static getElementSize( element, type ) {
		if ( !element || !( element instanceof Element ) || ( type !== 'width' && type !== 'height' ) ) {
			mw.log.error( '[TabberNeue] Invalid element or type provided for getElementSize' );
			return 0;
		}

		let value = element.getBoundingClientRect()[ type ];

		if ( value === 0 ) {
			value = this.getHiddenElementSize( element, type );
		}

		return value;
	}

	/**
	 * Retrieves the size of a hidden element by cloning it and calculating the size.
	 *
	 * @param {Element} element - The hidden element to retrieve the size from.
	 * @param {string} type - The type of size to retrieve ('width' or 'height').
	 * @return {number} The size of the hidden element based on the specified type.
	 */
	static getHiddenElementSize( element, type ) {
		const shadowRoot = document.createElement( 'div' ).attachShadow( { mode: 'open' } );
		const clone = element.cloneNode( true );
		clone.style.position = 'absolute';
		clone.style.visibility = 'hidden';
		shadowRoot.appendChild( clone );
		try {
			const value = clone.getBoundingClientRect()[ type ];
			return value;
		} finally {
			clone.parentNode.removeChild( clone );
		}
	}

	/**
	 * Rounds the scrollLeft value to the nearest integer using Math.ceil.
	 * Used to avoid the fractional pixel issue caused by different browser implementations
	 *
	 * @param {number} val - The scrollLeft value to be rounded.
	 * @return {number} The rounded scrollLeft value.
	 */
	static roundScrollLeft( val ) {
		return Math.ceil( val );
	}

	/**
	 * Sets the attributes of the given element based on the provided attributes object.
	 *
	 * @param {Element} element - The element to set attributes for.
	 * @param {Object} attributes - An object containing key-value pairs of attributes to set.
	 */
	static setAttributes( element, attributes ) {
		for ( const key in attributes ) {
			element.setAttribute( key, attributes[ key ] );
		}
	}
}

module.exports = Util;

let uniqueHashes;

/**
 * Class representing a Hash utility for generating unique hash values.
 *
 * @class Hash
 */
class Hash {
	/**
	 * Initializes the Hash class by creating a new Set to store unique hashes.
	 */
	static init() {
		uniqueHashes = new Set();
	}

	/**
	 * Checks if a given hash is not unique by verifying if it exists in the Set of unique hashes.
	 *
	 * @param {string} hash - The hash to check for uniqueness.
	 * @return {boolean} - Returns true if the hash is not unique, false otherwise.
	 */
	static exists( hash ) {
		return uniqueHashes.has( hash );
	}

	/**
	 * Generates a unique hash based on the input hash by appending a suffix if necessary.
	 *
	 * @param {string} hash - The base hash to make unique.
	 * @return {string} - A unique hash derived from the input hash.
	 */
	static makeUnique( hash ) {
		const match = hash.match( /^(.+)_([0-9]+)$/ );
		let suffix = match ? parseInt( match[ 2 ], 10 ) + 1 : 1;

		const initialHash = hash;

		let uniqueHash = `${ initialHash }_${ suffix }`;
		// Increment suffix and generate a new unique hash until a unique one is found
		while ( Hash.exists( uniqueHash ) ) {
			suffix++;
			uniqueHash = `${ initialHash }_${ suffix }`;
		}

		return uniqueHash;
	}

	/**
	 * Builds a unique hash based on the provided title text.
	 *
	 * @param {string} titleText - The title text to generate the hash from.
	 * @param {boolean} useLegacyTabIds - Whether to use the legacy tab ID format.
	 * @return {string} - A unique hash created from the title text.
	 */
	static build( titleText, useLegacyTabIds ) {
		let hash = mw.util.escapeIdForAttribute( titleText );
		if ( !useLegacyTabIds ) {
			hash = `tabber-${ hash }`;
		}

		if ( Hash.exists( hash ) ) {
			hash = Hash.makeUnique( hash );
		}

		uniqueHashes.add( hash );
		return hash;
	}

	/**
	 * Clears the Set of unique hashes, removing all stored hashes.
	 */
	static clear() {
		uniqueHashes.clear();
	}
}

module.exports = Hash;

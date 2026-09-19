<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Scribunto;

use InvalidArgumentException;

/**
 * Converts a Lua attribute table into the `$args` array a tag handler produces,
 * so both surfaces reach the same Sanitizer::validateTagAttributes call.
 *
 * Names are lexed with the same pattern Sanitizer::decodeTagAttributes applies
 * to tag attributes, because Sanitizer::validateTagAttributes assumes that
 * precondition. Which names are *allowed* remains the Sanitizer's decision, so
 * no second allowlist is introduced here.
 */
final class LuaAttributeNormaliser {

	/** @see \MediaWiki\Parser\Sanitizer::decodeTagAttributes */
	private const ATTRIBUTE_NAME_REGEX = '/^[:_\p{L}\p{N}][:_.\-\p{L}\p{N}]*$/uD';

	/**
	 * @param mixed $attributes Lua table, or null when the argument was omitted
	 * @return array<string,string>
	 * @throws InvalidArgumentException Reported to the module author as a LuaError.
	 */
	public static function normalise( mixed $attributes ): array {
		if ( $attributes === null ) {
			return [];
		}
		if ( !is_array( $attributes ) ) {
			throw new InvalidArgumentException(
				'attributes must be a table, ' . self::luaType( $attributes ) . ' given'
			);
		}

		$normalised = [];
		foreach ( $attributes as $name => $value ) {
			// A Lua sequence, or a numeric string key, arrives as an int.
			if ( !is_string( $name ) ) {
				throw new InvalidArgumentException(
					'attribute name must be a string, got ' . var_export( $name, true ) .
					'; a Lua sequence is not a set of attributes'
				);
			}
			// Tag attribute names are case-insensitive because decodeTagAttributes
			// lowercases them; do the same so `{ ID = 'x' }` is not silently dropped.
			$name = strtolower( $name );
			if ( !preg_match( self::ATTRIBUTE_NAME_REGEX, $name ) ) {
				throw new InvalidArgumentException(
					"'$name' is not a valid HTML attribute name"
				);
			}
			$normalised[$name] = self::normaliseValue( $name, $value );
		}

		return $normalised;
	}

	/**
	 * @param string $name
	 * @param mixed $value
	 * @throws InvalidArgumentException
	 */
	private static function normaliseValue( string $name, mixed $value ): string {
		// `true` matches a bare `<tabber wrap>`, which resolveTabWrap reads as ''.
		if ( $value === true ) {
			return '';
		}
		if ( $value === false ) {
			return 'false';
		}
		if ( is_string( $value ) ) {
			return $value;
		}
		if ( is_int( $value ) ) {
			return (string)$value;
		}
		if ( is_float( $value ) ) {
			// A non-finite value is never a useful attribute and only ever
			// signals a bug in the module. Name it without coercing it: PHP 8.5
			// raises "unexpected NAN value was coerced to string".
			if ( !is_finite( $value ) ) {
				$shown = is_nan( $value ) ? 'nan' : ( $value > 0 ? 'inf' : '-inf' );
				throw new InvalidArgumentException(
					"attribute '$name' must be a finite number, $shown given"
				);
			}
			return (string)$value;
		}

		throw new InvalidArgumentException(
			"attribute '$name' must be a string, number or boolean, " .
			self::luaType( $value ) . ' given'
		);
	}

	/**
	 * PHP type names leak the host language into errors a module author reads.
	 *
	 * @param mixed $value
	 */
	private static function luaType( mixed $value ): string {
		return match ( gettype( $value ) ) {
			'array' => 'table',
			'NULL' => 'nil',
			'integer', 'double' => 'number',
			'object' => 'userdata',
			default => gettype( $value ),
		};
	}
}

local tabber = {}
local php

--- @class tabModel @Data model for a tab
--- @field label string @The label of the tab
--- @field content string @The content of the tab

function tabber.setupInterface()
	-- Boilerplate
	tabber.setupInterface = nil
	php = mw_interface
	mw_interface = nil

	-- Register this library in the "mw" global
	mw = mw or {}
	mw.ext = mw.ext or {}
	mw.ext.tabber = tabber

	package.loaded['mw.ext.tabber'] = tabber
end

--- Returns the wikitext for a tabber
---
--- @param args tabModel[] @The tabs to render
--- @param attributes table|nil @Attributes for the tabber element, e.g.
---   { id = 'x', class = 'y', ['data-z'] = '1', wrap = true }. Values may be
---   strings, numbers or booleans; true means a bare attribute, so
---   wrap = true matches <tabber wrap>. Names are lowercased and must be
---   valid HTML attribute names; disallowed ones are then dropped by the same
---   sanitizer the tag uses. Unlike tag attributes, values are passed through
---   literally — no entity decoding or whitespace collapsing. An invalid name
---   or value raises an error rather than being ignored.
--- @return string @The rendered tabber wikitext
function tabber.render( args, attributes )
	return php.render( args, attributes )
end

return tabber

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
--- @return string @The rendered tabber wikitext
function tabber.render( args )
	return php.render( args )
end

return tabber

![](https://upload.wikimedia.org/wikipedia/commons/d/d7/TabberNeue-icon-ltr.svg)
<div align="center">
<h1>TabberNeue</h1>

![](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/workflows/MediaWiki%20CI/badge.svg)
</div>

The TabberNeue extension allows wikis to create tabs within a page. It is a forked and rewritten version of [Extension:Tabber](https://www.mediawiki.org/wiki/Extension:Tabber). It includes multiple improvements such as page transclusion, responsive layout support, ARIA support, and conform to Wikimedia UI. **TabberNeue is a complete replacement of Tabber, please disable or remove Tabber before enabling TabberNeue.**

[Extension:TabberNeue on MediaWiki](https://www.mediawiki.org/wiki/Extension:TabberNeue).

## Requirements
* [MediaWiki](https://www.mediawiki.org) 1.43 or later

## Installation
You can get the extension via Git (specifying TabberNeue as the destination directory):

    git clone https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue.git TabberNeue

Or [download it as zip archive](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/archive/main.zip).

In either case, the "TabberNeue" extension should end up in the "extensions" directory 
of your MediaWiki installation. If you got the zip archive, you will need to put it 
into a directory called TabberNeue.

## Usage
TabberNeue uses the exact same syntax as Tabber.

### Simple tabbers
Tabs are created with `tabName=tabBody`, and separated by `|-|`. You can use any wikitext within your tabs, including templates and images.
```html
<tabber>
|-|First Tab Title=
First tab content goes here.
|-|Second Tab Title=
Second tab content goes here.
|-|Third Tab Title=
Third tab content goes here.
</tabber>
```

### Nested tabbers
Nested tabbers need to be written as parser functions. Instead of the `<tabber/>` tags, they are wrapped with `{{#tag:tabber|}}` and separated by `{{!}}-{{!}}`. It is useful when creating nested tabber.
```
<tabber>
|-|First Tab Title=
{{#tag:tabber|
Tab Title A=
Tab content A goes here.
{{!}}-{{!}}
Tab Title B=
Tab content B goes here.
{{!}}-{{!}}
Tab Title C=
Tab content C goes here.
}}
|-|Second Tab Title=
{{#tag:tabber|
Tab Title D=
Tab content D goes here.
{{!}}-{{!}}
Tab Title E=
Tab content E goes here.
{{!}}-{{!}}
Tab Title F=
Tab content F goes here.
}}
|-|Third Tab Title=
{{#tag:tabber|
Tab Title G=
Tab content G goes here.
{{!}}-{{!}}
Tab Title H=
Tab content H goes here.
{{!}}-{{!}}
Tab Title I=
Tab content I goes here.
}}
</tabber>
```

### Transclusion
With the transclusion mode, the syntax is different, and it's more similar to `<gallery>` syntax.

The contents of the page of the first tab will be transcluded. Other tabs will be transcluded on-demand with AJAX, performing a request to the MediaWiki api. Once requested, they won't be fetched again until the page is reloaded. Note that Tabbers on the transcluded page will not be rendered.

Tabs are created with `pageName|tabName`, and separated by a new line.
```html
<tabbertransclude>
First Page Name|First Tab Title
Second Page Name|Second Tab Title
Third Page Name|Third Tab Title
</tabbertransclude>
```

### HTML attributes
You can add HTML attributes such as ID and class to the tabber element.
```html
<tabber id="very-awesome-tabber" class="awesome-tabber" data-test="awesome-data">
|-|Awesome Tab Title 1=
Awesome first tab content goes here.
|-|Awesome Tab Title 2=
Awesome second tab content goes here.
|-|Awesome Tab Title 3=
Awesome third tab content goes here.
</tabber>
```

### Lua

Tabber can be invoked in Lua with the `mw.ext.tabber` library. For example:
```lua
mw.ext.tabber.render( {
    {
        label = 'Tab 1',
        content = 'Content 1'
    },
    {
        label = 'Tab 2',
        content = 'Content 2'
    },
    {
        label = 'Tab 3',
        content = 'Content 3'
    },
    {
        label = 'Tab 4',
        content = 'Content 4'
    }
} )
```

## Configurations
Name | Description | Values | Default
:--- | :--- | :--- | :---
`$wgTabberNeueEnableAnimation` | Enable or disable smooth scroll animation |`true` - enable; `false` - disable | `true`
`$wgTabberNeueParseTabName` | Parse tab name as wikitext. This can have a performance impact and cause unexpected behaviors. |`true` - enable; `false` - disable | `false`
`$wgTabberNeueUpdateLocationOnTabChange` | If enabled, when a tab is selected, the URL displayed on the browser changes. Opening this URL makes that tab initially selected |`true` - enable; `false` - disable | `true`
`$wgTabberNeueAddTabPrefix` | If enabled, tabpanel IDs will be prepended with "tabber-" to avoid conflicts with page headings. |`true` - enable; `false` - disable | `true`

#### Tracking category
TabberNeue adds a tracking category to all pages using Tabber for maintenance purposes. There are two ways to suppress the category from viewers:
1. Hide the categories by putting `__HIDDENCAT__` in the category page
2. Remove the categories by creating the following pages and empty the page:
```
MediaWiki:Tabberneue-tabber-category
MediaWiki:Tabberneue-tabbertransclude-category
```

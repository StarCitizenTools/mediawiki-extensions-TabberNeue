![](https://upload.wikimedia.org/wikipedia/commons/d/d7/TabberNeue-icon-ltr.svg)
# TabberNeue
![](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/workflows/MediaWiki%20CI/badge.svg)

The TabberNeue extension allows wikis to create tabs within a page. It is a rewritten and forked version of [Extension:Tabber](https://www.mediawiki.org/wiki/Extension:Tabber). It includes multiple improvements such as responsive layout support, ARIA support, and conform to Wikimedia UI. **TabberNeue is a complete replacement of Tabber, please disable or remove Tabber before enabling TabberNeue.**

[Extension:TabberNeue on MediaWiki](https://www.mediawiki.org/wiki/Extension:TabberNeue).

## Requirements
* [MediaWiki](https://www.mediawiki.org) 1.35 or later

## Installation
You can get the extension via Git (specifying TabberNeue as the destination directory):

    git clone https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue.git TabberNeue

Or [download it as zip archive](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/archive/main.zip).

In either case, the "TabberNeue" extension should end up in the "extensions" directory 
of your MediaWiki installation. If you got the zip archive, you will need to put it 
into a directory called TabberNeue.

## Usage
TabberNeue uses the exact same syntax as Tabber.
Tabs are created with `tabName=tabBody`, and separated by `|-|`.
```html
<tabber>
 tab1=Some neat text here
|-|
 tab2=
 [http://www.google.com Google]<br/>
 [http://www.cnn.com Cnn]<br/>
|-|
 tab3={{Template:SomeTemplate}}
</tabber>
```

### Parser functions and conditionals
```html
<tabber>
Tab1 = {{{1|}}}
|-|
Tab2 = {{{2|}}}
</tabber>
```
Becomes:
```
{{#tag:tabber|
Tab1={{{1|}}}
{{!}}-{{!}}
Tab2={{{2|}}}
}}
```

## Configurations
Name | Description | Values | Default
:--- | :--- | :--- | :---
`$wgTabberNeueMD5Hash` | Enable or disable appending unique MD5 hash key to tabs. Disable if you need permalink to specific tabs. | `true`; `false` | `true`

# Changelog

## [2.3.0](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.2.4...v2.3.0) (2024-07-03)


### Features

* change tab when URL hash matches one of the tabs ([421c42b](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/421c42b6f082ca3cc81d9a89db8490143ff8180b)), closes [#150](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/150)


### Bug Fixes

* prevent browser from scrolling to the tab before Tabber updates the aria attributes ([1e5ad65](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/1e5ad6592b822f945e2ab1756b396b9f0bdedf9d)), closes [#161](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/161)
* square brackets should be correctly rendered in tab names ([3bacdb7](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/3bacdb7c87b1076bd7e036c929ff91ee6edc2a86)), closes [#158](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/158)
* URL hash should be escaped when used as selector ([d453add](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/d453adde074fe9a465e0ed83f11f70c9b80bfde5))

## [2.2.4](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.2.3...v2.2.4) (2024-06-23)


### Bug Fixes

* escape new line character properly ([7e92502](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7e92502c16c2635f8cdafe8d4fb78b2d6eaa70fe))

## [2.2.3](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.2.2...v2.2.3) (2024-06-23)


### Bug Fixes

* add new lines to parsed tab content to ensure content are parsed as expected ([f4f8b4b](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/f4f8b4bfcea876c5c6b3dc7ee40b4b06c9586a42)), closes [#151](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/151)
* attach resize observer properly to current active tabpanel ([72adfbc](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/72adfbc74ee9facac9c714fe2ce0844b61254edd))


### Performance Improvements

* only attach resize observer for active tabpanel when it is in viewport ([05e95d8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/05e95d880daf76749e7ebdebb06b7a387a0d0f73))
* set active tab by hash on builder phase ([ee54cc1](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/ee54cc1bb3dd725990296d3f1a485e570cc33881))

## [2.2.2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.2.1...v2.2.2) (2024-06-20)


### Bug Fixes

* make sure that init functions are run sequentially ([8a88a43](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/8a88a43d581ff1708aafeef61e7bd8bc45f3aa5d)), closes [#148](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/148)


### Performance Improvements

* merge activeTabpanel resize observer into the main resizeObserver ([35ffe55](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/35ffe555c07fd06439db5c7e161cd1214a65d6c0))
* only use one resizeObserver for header overflow ([a414d2d](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/a414d2df707e44c6ac629dcbd737b3c9bda4dc0d))

## [2.2.1](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.2.0...v2.2.1) (2024-06-06)


### Bug Fixes

* prepend tabber ID with prefix to avoid conflict with existing header ([d150b9e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/d150b9e3e9cfb8f395556bbea50e6cd0addb0bad))
* refresh Tabber height when it comes into viewport ([8b39e9e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/8b39e9e9702be1f9b977bf1a5a16358f577dfd2f)), closes [#137](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/137)
* use resizeObserver on active tabpanel instead ([0177715](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0177715f2b043606ce1ee61631a4117188594966))

## [2.2.0](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.1.1...v2.2.0) (2024-06-02)


### Features

* add home and end key shortcuts on tablist ([ac27855](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/ac27855dec668cc05d45f6f9118f767461338a4b))
* add screen reader text to navigation button ([0904298](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0904298948e7b7916699c156cc905ce262ab5229))


### Bug Fixes

* incorrect tab colors ([20e88b8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/20e88b8b5a6dd1f4c91d7a0c2735316301c4dc19))
* set tabindex -1 on hidden tabs ([7e921a4](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7e921a4a3a4b9f7d467b22272b477a06c638f04e))


### Miscellaneous Chores

* use starcitizentools as vendor in composer ([ceb719d](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/ceb719d83a0812c448cc12e13a9b5a7bf587a38e))

## [2.1.1](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.1.0...v2.1.1) (2024-05-27)


### Bug Fixes

* do not unobserve tabber ([def1134](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/def11349b1398abd2dc0fd516581c11b622631a3))
* do not use passive scroll event listener for tab header ([032aef7](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/032aef7989c956b2bec7744e64d4ef537b84792c))


### Performance Improvements

* detach event listeners when not needed ([2819ba8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/2819ba83a9b333e7c07c3f2d1f02077dd747f018))

## [2.1.0](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/compare/v2.0.0...v2.1.0) (2024-05-25)


### Features

* add aria-selected support ([46596e4](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/46596e450f7ddfdcfcc308201e43762673b2efb3))
* add background fade to indicate scrollable tab header ([750dd27](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/750dd273be7d4cd1bf5e8e3441c1dd40d1aa85a5))
* add basic VE support for tabbertransclude tag ([d0be57a](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/d0be57a629119f06fc3fb9e90b2763ec499c353d))
* add basic VisualEditor support for tabber tags ([6165b06](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/6165b06f2860cb67bb70d8b680dcf4e43cac4e8a))
* add config to disable MD5 hash ([#6](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/6)) ([d44cbbf](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/d44cbbf6b97515005900a39b068b500dc003c8e6))
* add config to toggle Tabber animation and default to false ([122df77](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/122df779e712d8288d0373f697cf69dd0c491fb3))
* add experimental support of Codex ([89e90af](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/89e90af03495701f259c91b21e94da88674fbeb7))
* add hover and active states to the arrow buttons ([530cdfa](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/530cdfa1b83ac2b0e2e0fba157521e8e55165ba0))
* add HTTP status code to error message ([38a4730](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/38a47307d7efb2cbf8d9185e785e9f6979c2149e))
* add initial Parsoid support for the tabber tag ([3220bb8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/3220bb8ef48523d1759d56f0051613201b097e32))
* add keyboard navigation to tabs ([bbde0ae](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/bbde0ae7bd1ca569192d6272cd0e65cc85653977))
* add langauge converter support ([874738d](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/874738db2a3b303dbe09aadf7789e1802d95c5e0))
* add link to documentation in VE context item ([5df6a0f](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5df6a0f77264e57cd5ba004558e0edb61657feb0))
* add proper ARIA attributes to lazyloaded transclusions ([7504ce5](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7504ce5cd233521b87dd4a4f263d603c9123521b))
* add scroll snap to section ([1ff78cd](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/1ff78cd0b2ad79074cbc7c192361505bb101b208))
* add support for nested tabbers in Codex ([#95](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/95)) ([7f75899](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7f7589999582e56a1dcf0e5af02ba12e6223a17f))
* add Tabber icon in VisualEditor ([5410a14](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5410a1496fc576939b9b591936ae30b3bbadfa4c))
* add tracking categories for pages using Tabber ([8fdead8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/8fdead811e774271c3074ef331009aa4491d05be))
* add Vue component for tab content ([a4e5905](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/a4e59057bf4a11ba0c6495e2ae2fe234b94d3fac))
* allow for identical tab header ([#28](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/28)) ([52baab5](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/52baab566bd1cc951f9e5d692898985082587dec))
* allow nested Tabber to be shown in VE preview ([857f6f1](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/857f6f1f9f321813a885a32cd457d612a29bdc6d))
* allow tab content to be transclusions of other pages ([d8c3db4](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/d8c3db4e5935476e496d979fb01f775d3d3282e6))
* allow tab name to be parsed ([7b1c319](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7b1c319e24af2e90f37d78c0aea4578ce5c26612)), closes [#35](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/35)
* append __NOEDITSECTION__ to tabber body before parsing ([#9](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/9)) ([3f689e0](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/3f689e0b28653bc3addfd8d32f68d907c6c46d19))
* avoid layout shift in init ([9162321](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/9162321c3c751ae6f897bf7394443a5e125c6b2d))
* bump requirement to &gt; MW 1.39 ([ebb1028](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/ebb10283dc6543c55dadfff7e67187975b349e9e))
* **core:** use data-title instead of title attribute for tab panel ([7b61ca6](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7b61ca663e2e1f1b93d1430fcf1fb5394f730c06))
* do not animate indicator when scrolling ([e124e81](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/e124e8170a6915fd9e13367af983bae36952f9b6))
* do not run Tabber script if it is already activated ([3454f7b](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/3454f7b2ceba9d4246ec256632e0ace5a7c6d25f))
* do not set title attribute for tab panel ([6a40de7](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/6a40de7b37291f3a9c48785cf16a878b06844263))
* generate tab header in visual edit mode ([84273da](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/84273da412cbdd61c34ea7a41b72b1deb9812c59))
* highlight text inside tabber tags as wikitext in CodeMirror ([2d86edc](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/2d86edc3c1a90c1d1df734990c2f7c104e58b45f))
* improve handling of animation ([b4b66b8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/b4b66b817210729027682886996fdffeac77c020))
* improve loading behavior before module is added ([1f44368](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/1f4436843f18718051d556ce415720cc2f3d245f))
* improve noscript support ([365777e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/365777eae3034561d76c141eceee47899369b4f4))
* initial refactor into TabberNeue ([eb95645](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/eb9564509b8abf39068233867010e8e4713ec45b))
* only smooth scroll in viewport larger than tablet ([775d38e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/775d38e36a8a4abbacbe49584ea4c43a42ab6069))
* reinitalize Tabber after VE edit ([cbf6ca0](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/cbf6ca0c1f87085aae5e652f0089812046a827c4))
* reinitialize Tabber after VE edit part 2 ([a29e3a2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/a29e3a22c028ed8edd2baa495f2bcde9cbc5a761))
* replace loading message with animation ([893611e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/893611e41d6f34b9e82405a2bca0823624a37ed4))
* rewrite Javascript implementation ([bb110c6](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/bb110c6d982f250c914818e6899272798ca0944d))
* scroll target hash tabber into view ([#62](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/62)) ([5b4f9ad](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5b4f9adc15ed47f0dd7073ee9dbb09df53203fa4))
* separate indicator from active tab ([f1e0df2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/f1e0df2112eb4e422beb3d606d4f337ff9ec525d))
* set animation to true as that bug has been resolved upstream ([947a47a](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/947a47af2e3a06b70e70ac9910d8fb7ebd5eebc1))
* trim spaces between title and content ([98c6f27](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/98c6f2753ad845a6b3d41624447927b8c3806375))
* tweak styles of tab header ([c045490](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/c045490a0182caa891a54b83e584b64ede60e90c))
* update French translation ([#23](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/23)) ([f610d66](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/f610d66385663df17092f694084f9f410bb620f5))
* update header buttons when scrolling without them ([#7](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/7)) ([5c40e1f](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5c40e1fb05d1199e64938d1b517468bda1e6cf77))
* use button elements instead of div for header navigations ([6ad2464](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/6ad24645e914aaa03d611416cf01f2d4c96b8289))
* use clone element to get tab height when needed ([331b0be](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/331b0bea2b0f1be3eb4013617d67034a1b49042b))
* use CSS instead of __NOEDITSECTION__ to hide edit buttons ([69c6383](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/69c638330d02c303e1509192edcdc452bc787a13)), closes [#12](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/12)
* use recursiveTagParseFully to parse tab input ([66db3a4](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/66db3a4b8b07f89ae8bbfc9380784a787b327999))
* use replaceState instead of pushState on tab click ([1959fb2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/1959fb2928caae04a5dfe710bf636c83e17cac08))
* use skeleton screen as transclude load animation ([a66f6e6](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/a66f6e604fea64434eb3e5f3f33ad91a978906c8))
* use Tabber count instead of MD5 as identifier ([09715dc](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/09715dcef69d0d3d06e2a737ecbfd3e66b2caed8))
* use the new HookContainer system ([007f194](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/007f1942dee806dbbecb91367684581e01021062))
* use the ResizeObserver api to detect content size changes ([2d4d412](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/2d4d4121fd77e6d6877cd44e6ce2d2907da1922e))
* use wikipage.content hook to init scripts ([5a27351](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5a2735121f34a050d44b5ff2f565705bf828fed0))
* wrap tab content in &lt;p&gt; if there are no HTML elements ([a3212b6](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/a3212b6c2b62a12b6cc0ca68a380b9f3c6a6b91b))


### Bug Fixes

* add null check for $input ([51893d8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/51893d8b9d740cdaf10b4c6fb2056dec2949776c))
* allow composer/installers in ci ([0e69def](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0e69defa311b3510ea1521a4f8e66e21e2400816))
* always round scrollLeft ([99413c7](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/99413c7854212a2d738730d1194fb2f49371ebb5))
* Argument [#1](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/1) ($input) must be of type string, null given ([#112](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/112)) ([a6c61af](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/a6c61af08da11654fbac311f31be9c10109aef43))
* aria-hidden return string instead of boolean ([7c95e57](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7c95e570a8ad8796e77879883b533e355218bf75))
* attach tabber--live class after tabber has finished init ([6d09429](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/6d09429849d43b36673519cc936aa288db567001))
* avoid using noscript as it is disallowed by VE ([0fbfefc](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0fbfefcb879a8aeaf957e90ea714178db15060df))
* **ci:** fix incorrect directory in CI ([#75](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/75)) ([7f04013](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7f04013085a2d80304849b978fc94bb472bf0b36))
* deprecate mobile target ([6e67dd2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/6e67dd2abbde1c641b631e462d765c8a241e8926)), closes [#120](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/120)
* deprecate old RL class ([64cafa8](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/64cafa84f88dcc9933f2680c70ad03a383234a9a))
* disable Parsoid extension module support ([dc3cb20](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/dc3cb203a323700185464f592ced9ef166756223))
* DOMException caused by invalid selector ([#10](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/10)) ([9395d64](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/9395d641a980a1532503bc96226bdf4de428f3ed))
* fix var scope in VE scripts ([f8e3b75](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/f8e3b758b2b95754a302970a537bf8565f69331e))
* hide duplicate images generated by MobileFrontend ([047ba17](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/047ba17d1bb47d2c12eed6fde9602dae98ff4ff1)), closes [#2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/2)
* incorrect aria attribute label ([b9eda4c](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/b9eda4c4e7fa0bfdae8b509a3ee65b9518b60ddf))
* incorrect character trimming for tab IDs ([5e4471d](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5e4471d23f5f4241025776a659e577bb47388946))
* incorrect config name in readme ([3358e2e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/3358e2e49c15d0ae8d3c0d2233221ea7983e717e))
* incorrect RL class name ([cfe539d](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/cfe539df906890c511d145ab68d2cc52bb50f661))
* incorrect selector for hiding tabpanel in init ([0a3b305](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0a3b30504d5a038584a542aa597155a9457cdbe7))
* indicator should be visible for nested tabs ([62cb545](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/62cb54564290ac2ab6625d10f70a9b90ac1b743e))
* indicator should not expand header height ([1cb5cfb](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/1cb5cfb6c7b7a36c872033369edf85e64bd81fb2))
* jumping to a tabber when no hash specified ([#63](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/63)) ([787fede](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/787fede5320f022343b166f7449e64fc490eff9c))
* more accurate selector for duplicated MF images ([380d52e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/380d52e24c5d050c4f047d66f20d64031da9c14d))
* one pixel offset on tab panels ([#47](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/47)) ([d70049f](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/d70049f67b7fd0743a81cefabe0aa9073be22d74))
* only resize section when it is the active panel ([5416652](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/54166529cbb5fb9cc6261107865cce7911562642))
* override default MW list styles ([5f856a1](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/5f856a1a73fa129d7c7c77b9c011be9bade3a4c1))
* panel should adjust to content height ([7762a0e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/7762a0e9f4a3e5b5720c9bd95dace55676b54df9))
* PHP Notice: Uninitialized string offset: 0 ([#108](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/108)) ([9a795f2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/9a795f2a74d1c989d93a4cc5fe5db249ce53fed9))
* recalculate height based on tab content ([2ee7bea](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/2ee7bea7e99c32c5dceb5c3aadbc06f9a059ff77))
* run script after document is ready ([#25](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/25)) ([e54a313](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/e54a313de48003b0979cabeb6811a0bcf28db574))
* stricter selector to prevent issues with nested Tabber ([342cc2a](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/342cc2aa857d9ff9d18df678593a1402bcfb62be))
* stricter selectors for activePanel selection ([0dc1b34](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0dc1b34965d8e52b65bcc4b9902dc83a8c1de98c))
* tab panel going out of bound ([8ab7b83](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/8ab7b8330d15c1c15fef8d30d9aea2286dd7bd2f))
* typo in variable ([852256a](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/852256a75df644769ee0c092b63269b5ad86bd38))
* use data-title for tab panel ([#74](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/74)) ([18f278e](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/18f278e1ad149e688a9896b486b3b7df4625681c))


### Performance Improvements

* revert back to recursiveTagParse() ([#27](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/issues/27)) ([9535181](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/95351812613e04717f3ad7844cfcc67e4ede4d11))


### Miscellaneous Chores

* add missing release-please files ([09fe911](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/09fe911d5ce74945e6a6f6d6f2291a025c1c76df))
* ci cleanup ([cb1dbb2](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/cb1dbb239fbb7b998db398e68c7b2cf3b59eac37))
* **ci:** more robust linter ([dea3264](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/dea326423c0029e586eaef07a5e24b242f260fdd))
* re-generate package-lock.json ([8a71685](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/8a7168556a12b8805293ea0ed7a7b6a6d84c211d))
* refactor lint workflow and add release-please ([251c9b9](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/251c9b932c5cb3cc66e0a00f345771d3f317646f))
* set up dependabot ([0617ae5](https://github.com/StarCitizenTools/mediawiki-extensions-TabberNeue/commit/0617ae5d53f8ed9ae806ab7d39974a5e76894012))

<template>
	<cdx-tabs v-model:active="currentTab" :framed="framed">
		<cdx-tab
			v-for="( tab, index ) in tabsData"
			:key="index"
			:name="tab.name"
			:label="tab.label"
			:disabled="tab.disabled"
		>
			<tab-content
				:html="tab.content"
			>
			</tab-content>
		</cdx-tab>
	</cdx-tabs>
</template>

<script>
const { defineComponent } = require( 'vue' );
// Codex is available from ResourceLoader at runtime and is available without needing a build step.
const { CdxTabs, CdxTab } = require( '@wikimedia/codex' );
const TabContent = require( './TabContent.vue' );

// @vue/component
module.exports = exports = defineComponent( {
	name: 'App',
	compatConfig: {
		MODE: 3
	},
	compilerOptions: {
		whitespace: 'condense'
	},
	components: {
		CdxTabs: CdxTabs,
		CdxTab: CdxTab,
		TabContent: TabContent
	},
	props: {
		tabberData: {
			type: Object,
			required: true
		},
		framed: {
			type: Boolean,
			default: false
		}
	},
	data: function () {
		return {
			tabsData: this.tabberData.tabsData,
			currentTab: this.tabberData.currentTab
		};
	},
	mounted: function () {
		this.$el.parentElement.classList.add( 'tabber--live' );
	}
} );
</script>

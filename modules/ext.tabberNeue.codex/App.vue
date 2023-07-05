<template>
	<cdx-tabs v-model:active="currentTab" :framed="framed">
		<cdx-tab
			v-for="( tab, index ) in tabsData"
			:key="index"
			:name="tab.name"
			:label="tab.label"
			:disabled="tab.disabled"
			v-html = "tab.content"
		>
		</cdx-tab>
	</cdx-tabs>
</template>

<script>
const { defineComponent } = require('vue');
// Codex is available from ResourceLoader at runtime and is available without needing a build step.
const { CdxTabs, CdxTab } = require('@wikimedia/codex');

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
		CdxTabs,
		CdxTab
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
	data() {
		return {
			tabsData: this.tabberData.tabsData,
			currentTab: this.tabberData.currentTab
		};
	},
	mounted() {
		console.log( this.$el );
		this.$el.parentElement.classList.add( 'tabber--live' );
	}
} );
</script>

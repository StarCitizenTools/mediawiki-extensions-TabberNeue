<template>

	<cdx-tabs v-if="isChildTabber && tabsData.length > 0" v-model:active="currentTab">
		<cdx-tab
			v-for="( tab, index ) in tabsData"
			:key="index"
			:name="tab.label"
			:label="tab.label"
		>
			<tab-content
				:html="tab.content"
			>
			</tab-content>
		</cdx-tab>
	</cdx-tabs>
	<div
		v-else
		v-html="html"
	>
	</div>
</template>

<script>
const { defineComponent } = require( 'vue' );
const { CdxTabs, CdxTab } = require( '@wikimedia/codex' );

// @vue/component
module.exports = exports = defineComponent( {
	name: 'TabContent',
	compatConfig: {
		MODE: 3
	},
	compilerOptions: {
		whitespace: 'condense'
	},
	data() {
		return {
			tabsData: [],

			currentTab: ''
		};
	},
	props: {
		html: {
			type: String,
			required: true
		}
	},
	components: {
		CdxTabs: CdxTabs,
		CdxTab: CdxTab,
	},
	methods: {
		isChildTabber() {
			return this.html.includes("{\"label\":")
		},
		parse() {
			const json = this.html.replace(/^<p>/, '').replace(/<\/p>$/, '')

			return JSON.parse(json);
		}
	},
	mounted: function () {
		if (this.isChildTabber()) {
			this.tabsData = this.parse(this.html)
			this.currentTab = this.tabsData[0].label
		}
	}
} );
</script>

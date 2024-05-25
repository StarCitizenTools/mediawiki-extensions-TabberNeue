<template>
	<CdxTabs v-if="isChildTabber && tabsData.length > 0" v-model:active="currentTab">
		<CdxTab
			v-for="( tab, index ) in tabsData"
			:key="index"
			:name="escapeId( tab.label )"
			:label="tab.label"
		>
			<tab-content
				:html="tab.content"
			></tab-content>
		</CdxTab>
	</CdxTabs>
	<div
		v-else
		v-html="html"
	></div>
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
	components: {
		CdxTabs: CdxTabs,
		CdxTab: CdxTab
	},
	props: {
		html: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			tabsData: [],

			currentTab: ''
		};
	},
	methods: {
		isChildTabber() {
			// eslint-disable-next-line es-x/no-array-prototype-includes
			return Array.isArray( this.html ) || this.html.includes( '{"label":' );
		},
		parse() {
			if ( Array.isArray( this.html ) ) {
				return this.html;
			} else {
				const tmp = document.createElement( 'div' );
				tmp.innerHTML = this.html;

				return JSON.parse( tmp.textContent.trim() );
			}
		},
		escapeId( id ) {
			return mw.util.escapeIdForAttribute( id );
		}
	},
	mounted: function () {
		if ( this.isChildTabber() ) {
			this.tabsData = this.parse( this.html );
			this.currentTab = this.escapeId( this.tabsData[ 0 ].label );
		}
	}
} );
</script>

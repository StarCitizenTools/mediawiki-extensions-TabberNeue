<template>
	<div 
		v-html="html"
	>
	</div>
</template>

<script>
const { defineComponent } = require( 'vue' );

// @vue/component
module.exports = exports = defineComponent( {
	name: 'TabContent',
	compatConfig: {
		MODE: 3
	},
	compilerOptions: {
		whitespace: 'condense'
	},
	props: {
		html: {
			type: String,
			required: true
		}
	},
	mounted: function () {
		this.$el.parentElement.innerHTML = this.$el.innerHTML;
	}
} );
</script>

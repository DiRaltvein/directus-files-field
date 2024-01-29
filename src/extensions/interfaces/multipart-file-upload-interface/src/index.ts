import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'custom-unlimited-file-upload',
	name: 'Custom unlimited file upload',
	icon: 'box',
	description: 'File upload that extends directus default file upload fields' +
		'functionality and in addition uploads files in pices to prevent 413 error',
	component: InterfaceComponent,
	types: ['alias'],
	localTypes: ['files'],
	group: 'relational',
	relational: true,
	options: ({ relations }) => {
		return [
			{
				field: 'folder',
				name: '$t:interfaces.system-folder.folder',
				type: 'uuid',
				meta: {
					width: 'full',
					interface: 'system-folder',
					note: '$t:interfaces.system-folder.field_hint',
				},
			},
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: relations.o2m?.collection,
					},
				},
			},
			{
				field: 'enableCreate',
				name: 'Enable create',
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
			{
				field: 'enableSelect',
				name: 'Enable select',
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
			{
				field: 'limit',
				name: '$t:per_page',
				type: 'integer',
				meta: {
					interface: 'input',
					width: 'half',
				},
				schema: {
					default_value: 15,
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
});

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class IManageApi implements ICredentialType {
	name = 'iManageApi';
	displayName = 'iManage API';
	documentationUrl = 'https://help.imanage.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://cloudimanage.com',
			placeholder: 'https://cloudimanage.com',
			description: 'The base URL of your iManage instance',
			required: true,
		},
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'Static Token (X-Auth-Token)',
					value: 'token',
				},
				{
					name: 'OAuth2 Password Grant',
					value: 'oauth2',
				},
			],
			default: 'token',
			description: 'The authentication method to use',
		},
		// Static Token auth
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: {
				show: {
					authMethod: ['token'],
				},
			},
			description: 'The X-Auth-Token for authentication',
		},
		// OAuth2 auth
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
			description: 'OAuth2 Client ID',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
			description: 'OAuth2 Client Secret',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
			description: 'iManage username for OAuth2 password grant',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			displayOptions: {
				show: {
					authMethod: ['oauth2'],
				},
			},
			description: 'iManage password for OAuth2 password grant',
		},
		// Optional config
		{
			displayName: 'Customer ID',
			name: 'customerId',
			type: 'string',
			default: '',
			description: 'iManage customer ID (leave empty to auto-discover)',
		},
		{
			displayName: 'Default Library',
			name: 'library',
			type: 'string',
			default: '',
			description: 'Default library to use (leave empty to use preferred library)',
		},
	];

	// For static token auth - used when authMethod is 'token'
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Auth-Token': '={{$credentials.apiToken}}',
			},
		},
	};

	// Test connection - for static token, test directly; for OAuth2, we test in the node
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api',
			method: 'GET',
			skipSslCertificateValidation: true,
		},
	};
}

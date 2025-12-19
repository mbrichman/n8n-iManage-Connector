import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';

interface IManageCredentials {
	baseUrl: string;
	authMethod: 'token' | 'oauth2';
	apiToken?: string;
	clientId?: string;
	clientSecret?: string;
	username?: string;
	password?: string;
	customerId?: string;
	library?: string;
}

interface DiscoveryResponse {
	data: {
		user?: {
			customer_id: number;
		};
		versions?: Array<{
			name: string;
			url: string;
		}>;
		work?: {
			preferred_library?: string;
			libraries?: Array<{
				alias: string;
			}>;
		};
	};
}

export class IManage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'iManage',
		name: 'iManage',
		icon: 'file:imanage.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with iManage Work API',
		defaults: {
			name: 'iManage',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'iManageApi',
				required: true,
			},
		],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Document',
						value: 'document',
					},
					{
						name: 'Folder',
						value: 'folder',
					},
					{
						name: 'Workspace',
						value: 'workspace',
					},
					{
						name: 'Discovery',
						value: 'discovery',
					},
				],
				default: 'document',
			},

			// ============================================
			// DOCUMENT OPERATIONS
			// ============================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get document metadata',
						action: 'Get document metadata',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download document content',
						action: 'Download document content',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for documents',
						action: 'Search for documents',
					},
					{
						name: 'Get Recent',
						value: 'getRecent',
						description: 'Get recently accessed documents',
						action: 'Get recent documents',
					},
				],
				default: 'get',
			},

			// Document ID
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['get', 'download'],
					},
				},
				default: '',
				placeholder: 'iManage!12345.1',
				description: 'The document ID in format library!docNumber.version',
			},

			// Document search parameters
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Search anywhere in document metadata',
			},

			// Document additional options
			{
				displayName: 'Options',
				name: 'documentOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['get'],
					},
				},
				options: [
					{
						displayName: 'Include Operations',
						name: 'includeOperations',
						type: 'boolean',
						default: false,
						description: 'Whether to include allowed operations in response',
					},
					{
						displayName: 'Get Latest Version',
						name: 'isLatest',
						type: 'boolean',
						default: false,
						description: 'Whether to get the latest version regardless of version in ID',
					},
				],
			},

			// Download options
			{
				displayName: 'Options',
				name: 'downloadOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['download'],
					},
				},
				options: [
					{
						displayName: 'Get Latest Version',
						name: 'latest',
						type: 'boolean',
						default: false,
						description: 'Whether to download the latest version',
					},
					{
						displayName: 'Binary Property',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property to store the file',
					},
				],
			},

			// Search options
			{
				displayName: 'Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['search'],
					},
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Search by document name',
					},
					{
						displayName: 'Author',
						name: 'author',
						type: 'string',
						default: '',
						description: 'Filter by author',
					},
					{
						displayName: 'Extension',
						name: 'extension',
						type: 'string',
						default: '',
						description: 'Filter by file extension (e.g., pdf, docx)',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 500,
						},
						default: 25,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},

			// Recent documents options
			{
				displayName: 'Options',
				name: 'recentOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['getRecent'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
						default: 25,
						description: 'Max number of results to return',
					},
				],
			},

			// ============================================
			// WORKSPACE OPERATIONS
			// ============================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['workspace'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get workspace details',
						action: 'Get workspace details',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List workspaces',
						action: 'List workspaces',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for workspaces',
						action: 'Search for workspaces',
					},
					{
						name: 'Get Children',
						value: 'getChildren',
						description: 'Get workspace children (folders/tabs)',
						action: 'Get workspace children',
					},
					{
						name: 'Get Recent',
						value: 'getRecent',
						description: 'Get recently accessed workspaces',
						action: 'Get recent workspaces',
					},
				],
				default: 'list',
			},

			// Workspace ID
			{
				displayName: 'Workspace ID',
				name: 'workspaceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['get', 'getChildren'],
					},
				},
				default: '',
				placeholder: 'iManage!12345',
				description: 'The workspace ID',
			},

			// Workspace search
			{
				displayName: 'Search Query',
				name: 'workspaceSearchQuery',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Search anywhere in workspace metadata',
			},

			// Workspace list/search options
			{
				displayName: 'Options',
				name: 'workspaceOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['list', 'search'],
					},
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Filter by workspace name',
					},
					{
						displayName: 'Custom1',
						name: 'custom1',
						type: 'string',
						default: '',
						description: 'Filter by custom1 field (often client/matter)',
					},
					{
						displayName: 'Custom2',
						name: 'custom2',
						type: 'string',
						default: '',
						description: 'Filter by custom2 field',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 500,
						},
						default: 25,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},

			// Workspace children options
			{
				displayName: 'Options',
				name: 'childrenOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['workspace'],
						operation: ['getChildren'],
					},
				},
				options: [
					{
						displayName: 'Children Type',
						name: 'childrenType',
						type: 'options',
						options: [
							{ name: 'All', value: 'all' },
							{ name: 'Folders Only', value: 'folders' },
							{ name: 'Tabs Only', value: 'tabs' },
						],
						default: 'all',
						description: 'Type of children to return',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 500,
						},
						default: 100,
						description: 'Max number of results to return',
					},
				],
			},

			// ============================================
			// FOLDER OPERATIONS
			// ============================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['folder'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get folder details',
						action: 'Get folder details',
					},
					{
						name: 'Get Children',
						value: 'getChildren',
						description: 'Get folder children (subfolders and documents)',
						action: 'Get folder children',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for folders',
						action: 'Search for folders',
					},
				],
				default: 'getChildren',
			},

			// Folder ID
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['get', 'getChildren'],
					},
				},
				default: '',
				placeholder: 'iManage!12345',
				description: 'The folder ID',
			},

			// Folder children options
			{
				displayName: 'Options',
				name: 'folderChildrenOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['getChildren'],
					},
				},
				options: [
					{
						displayName: 'Exclude Documents',
						name: 'excludeDocs',
						type: 'boolean',
						default: false,
						description: 'Whether to exclude documents from results',
					},
					{
						displayName: 'Exclude Folders',
						name: 'excludeFolders',
						type: 'boolean',
						default: false,
						description: 'Whether to exclude subfolders from results',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 500,
						},
						default: 100,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
			},

			// Folder search options
			{
				displayName: 'Search Query',
				name: 'folderSearchQuery',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Search query for folders',
			},
			{
				displayName: 'Options',
				name: 'folderSearchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['search'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 500,
						},
						default: 25,
						description: 'Max number of results to return',
					},
				],
			},

			// ============================================
			// DISCOVERY OPERATIONS
			// ============================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['discovery'],
					},
				},
				options: [
					{
						name: 'Get Environment Info',
						value: 'get',
						description: 'Get environment and user information',
						action: 'Get environment info',
					},
					{
						name: 'Get Libraries',
						value: 'getLibraries',
						description: 'Get available libraries',
						action: 'Get libraries',
					},
				],
				default: 'get',
			},

			// ============================================
			// COMMON OPTIONS
			// ============================================
			{
				displayName: 'Library',
				name: 'library',
				type: 'string',
				default: '',
				description: 'Library to use (leave empty to use default from credentials)',
				displayOptions: {
					hide: {
						resource: ['discovery'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials('iManageApi')) as unknown as IManageCredentials;

		// Get auth token - either static or via OAuth2
		let authToken = credentials.apiToken;

		if (credentials.authMethod === 'oauth2' && !authToken) {
			// Fetch OAuth2 token
			const tokenResponse = await this.helpers.httpRequest({
				method: 'POST',
				url: `${credentials.baseUrl}/auth/oauth2/token`,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'password',
					username: credentials.username || '',
					password: credentials.password || '',
					client_id: credentials.clientId || '',
					client_secret: credentials.clientSecret || '',
				}).toString(),
			}) as { access_token: string };

			authToken = tokenResponse.access_token;
		}

		if (!authToken) {
			throw new Error('No authentication token available. Please check your credential configuration.');
		}

		// Store token in credentials object for helper functions
		credentials.apiToken = authToken;

		// Get or discover customer ID and library
		let customerId = credentials.customerId;
		let defaultLibrary = credentials.library;
		let apiBaseUrl = `${credentials.baseUrl}/work/api/v2`;

		// If customer ID or library not set, discover them
		if (!customerId || !defaultLibrary) {
			const discoveryResponse = await this.helpers.httpRequest({
				method: 'GET',
				url: `${credentials.baseUrl}/api`,
				headers: getAuthHeaders(credentials),
				json: true,
			}) as DiscoveryResponse;

			if (!customerId && discoveryResponse.data?.user?.customer_id) {
				customerId = String(discoveryResponse.data.user.customer_id);
			}
			if (!defaultLibrary && discoveryResponse.data?.work?.preferred_library) {
				defaultLibrary = discoveryResponse.data.work.preferred_library;
			}
			// Get actual API URL if available
			const v2Version = discoveryResponse.data?.versions?.find((v) => v.name === 'v2');
			if (v2Version?.url) {
				apiBaseUrl = v2Version.url;
			}
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const library = (this.getNodeParameter('library', i, '') as string) || defaultLibrary;

				let responseData: IDataObject | IDataObject[];

				// ============================================
				// DOCUMENT OPERATIONS
				// ============================================
				if (resource === 'document') {
					if (operation === 'get') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const options = this.getNodeParameter('documentOptions', i, {}) as IDataObject;

						const params: IDataObject = {};
						if (options.includeOperations) params.include_operations = 'true';
						if (options.isLatest) params.is_latest = 'true';

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/documents/${documentId}`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else if (operation === 'download') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const options = this.getNodeParameter('downloadOptions', i, {}) as IDataObject;
						const binaryPropertyName = (options.binaryPropertyName as string) || 'data';

						const params: IDataObject = { activity: 'export' };
						if (options.latest) params.latest = 'true';

						// First get document metadata for filename
						const docMeta = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/documents/${documentId}`,
							apiBaseUrl,
							credentials,
						) as IDataObject;

						// Download the file
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${apiBaseUrl}/customers/${customerId}/libraries/${library}/documents/${documentId}/download`,
							headers: getAuthHeaders(credentials),
							qs: params,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						});

						const data = (docMeta.data || docMeta) as IDataObject;
						const fileName = `${data.name || documentId}.${data.extension || 'bin'}`;
						const mimeType = getMimeType(data.extension as string);

						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(response.body as Buffer),
							fileName,
							mimeType,
						);

						returnData.push({
							json: data,
							binary: {
								[binaryPropertyName]: binaryData,
							},
						});
						continue;
					} else if (operation === 'search') {
						const searchQuery = this.getNodeParameter('searchQuery', i, '') as string;
						const options = this.getNodeParameter('searchOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							limit: options.limit || 25,
							offset: options.offset || 0,
						};
						if (searchQuery) params.anywhere = searchQuery;
						if (options.name) params.name = options.name;
						if (options.author) params.author = options.author;
						if (options.extension) params.extension = options.extension;

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/documents`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else if (operation === 'getRecent') {
						const options = this.getNodeParameter('recentOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							limit: options.limit || 25,
						};

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/recent-documents`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else {
						throw new Error(`Unknown document operation: ${operation}`);
					}
				}

				// ============================================
				// WORKSPACE OPERATIONS
				// ============================================
				else if (resource === 'workspace') {
					if (operation === 'get') {
						const workspaceId = this.getNodeParameter('workspaceId', i) as string;

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/workspaces/${workspaceId}`,
							apiBaseUrl,
							credentials,
						);
					} else if (operation === 'list') {
						const options = this.getNodeParameter('workspaceOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							limit: options.limit || 25,
							offset: options.offset || 0,
						};
						if (options.name) params.name = options.name;
						if (options.custom1) params.custom1 = options.custom1;
						if (options.custom2) params.custom2 = options.custom2;

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/workspaces`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else if (operation === 'search') {
						const searchQuery = this.getNodeParameter('workspaceSearchQuery', i, '') as string;
						const options = this.getNodeParameter('workspaceOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							limit: options.limit || 25,
							offset: options.offset || 0,
						};
						if (searchQuery) params.anywhere = searchQuery;
						if (options.name) params.name = options.name;
						if (options.custom1) params.custom1 = options.custom1;
						if (options.custom2) params.custom2 = options.custom2;

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/workspaces`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else if (operation === 'getChildren') {
						const workspaceId = this.getNodeParameter('workspaceId', i) as string;
						const options = this.getNodeParameter('childrenOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							children_type: options.childrenType || 'all',
							limit: options.limit || 100,
						};

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/workspaces/${workspaceId}/children`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else if (operation === 'getRecent') {
						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/recent-workspaces`,
							apiBaseUrl,
							credentials,
						);
					} else {
						throw new Error(`Unknown workspace operation: ${operation}`);
					}
				}

				// ============================================
				// FOLDER OPERATIONS
				// ============================================
				else if (resource === 'folder') {
					if (operation === 'get') {
						const folderId = this.getNodeParameter('folderId', i) as string;

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/folders/${folderId}`,
							apiBaseUrl,
							credentials,
						);
					} else if (operation === 'getChildren') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						const options = this.getNodeParameter('folderChildrenOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							limit: options.limit || 100,
							offset: options.offset || 0,
						};
						if (options.excludeDocs) params.exclude_docs = 'true';
						if (options.excludeFolders) params.exclude_folders = 'true';

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/folders/${folderId}/children`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else if (operation === 'search') {
						const searchQuery = this.getNodeParameter('folderSearchQuery', i, '') as string;
						const options = this.getNodeParameter('folderSearchOptions', i, {}) as IDataObject;

						const params: IDataObject = {
							limit: options.limit || 25,
						};
						if (searchQuery) params.anywhere = searchQuery;

						responseData = await iManageRequest.call(
							this,
							'GET',
							`/customers/${customerId}/libraries/${library}/folders/search`,
							apiBaseUrl,
							credentials,
							params,
						);
					} else {
						throw new Error(`Unknown folder operation: ${operation}`);
					}
				}

				// ============================================
				// DISCOVERY OPERATIONS
				// ============================================
				else if (resource === 'discovery') {
					if (operation === 'get') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${credentials.baseUrl}/api`,
							headers: getAuthHeaders(credentials),
							json: true,
						});
						responseData = response as IDataObject;
					} else if (operation === 'getLibraries') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${credentials.baseUrl}/api`,
							headers: getAuthHeaders(credentials),
							json: true,
						}) as DiscoveryResponse;
						responseData = (response.data?.work?.libraries || []) as unknown as IDataObject[];
					} else {
						throw new Error(`Unknown discovery operation: ${operation}`);
					}
				} else {
					throw new Error(`Unknown resource: ${resource}`);
				}

				// Handle response data
				if (responseData !== undefined) {
					const rawData = (responseData as IDataObject).data || responseData;
					if (Array.isArray(rawData)) {
						// Direct array response (e.g., libraries list)
						for (const item of rawData) {
							returnData.push({ json: item as IDataObject });
						}
					} else if (typeof rawData === 'object' && rawData !== null) {
						// Check for nested results
						const dataObj = rawData as IDataObject;
						if (dataObj.results && Array.isArray(dataObj.results)) {
							for (const item of dataObj.results as IDataObject[]) {
								returnData.push({ json: item });
							}
						} else {
							returnData.push({ json: dataObj });
						}
					} else {
						returnData.push({ json: responseData as IDataObject });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// Helper function to get auth headers
function getAuthHeaders(credentials: IManageCredentials): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: 'application/json',
	};

	// Debug: log credential keys (not values for security)
	console.log('iManage credentials keys:', Object.keys(credentials));
	console.log('iManage authMethod:', credentials.authMethod);
	console.log('iManage apiToken exists:', !!credentials.apiToken);
	console.log('iManage apiToken length:', credentials.apiToken?.length || 0);

	// Handle both auth methods
	if (credentials.apiToken) {
		headers['X-Auth-Token'] = credentials.apiToken;
		console.log('iManage: Added X-Auth-Token header');
	} else {
		console.log('iManage: WARNING - No apiToken found in credentials!');
	}

	return headers;
}

// Helper function to make iManage API requests
async function iManageRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	apiBaseUrl: string,
	credentials: IManageCredentials,
	params?: IDataObject,
	body?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${apiBaseUrl}${endpoint}`,
		headers: {
			'Accept': 'application/json',
			'X-Auth-Token': credentials.apiToken || '',
		},
		json: true,
	};

	if (params && Object.keys(params).length > 0) {
		options.qs = params;
	}

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	// Throw helpful error if no token
	if (!credentials.apiToken) {
		throw new Error('No API token found in credentials. Please check your iManage API credential configuration.');
	}

	return (await this.helpers.httpRequest(options)) as IDataObject;
}

// Helper function to get MIME type from extension
function getMimeType(extension: string): string {
	const mimeTypes: Record<string, string> = {
		pdf: 'application/pdf',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xls: 'application/vnd.ms-excel',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		ppt: 'application/vnd.ms-powerpoint',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		txt: 'text/plain',
		csv: 'text/csv',
		html: 'text/html',
		xml: 'application/xml',
		json: 'application/json',
		zip: 'application/zip',
		msg: 'application/vnd.ms-outlook',
		eml: 'message/rfc822',
	};

	return mimeTypes[extension?.toLowerCase()] || 'application/octet-stream';
}

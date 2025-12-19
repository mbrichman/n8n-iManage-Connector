# n8n-nodes-imanage

This is an n8n community node for integrating with [iManage Work](https://imanage.com/) document management system.

## Features

This node provides the following operations:

### Documents
- **Get** - Retrieve document metadata
- **Download** - Download document content as binary data
- **Search** - Search for documents with filters
- **Get Recent** - Get recently accessed documents

### Workspaces
- **Get** - Retrieve workspace details
- **List** - List workspaces in a library
- **Search** - Search for workspaces across libraries
- **Get Children** - Get workspace children (folders/tabs)
- **Get Recent** - Get recently accessed workspaces

### Folders
- **Get** - Retrieve folder details
- **Get Children** - Get folder contents (subfolders and documents)
- **Search** - Search for folders

### Discovery
- **Get Environment Info** - Get environment and user information
- **Get Libraries** - Get available libraries

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-imanage` in the npm package name field
4. Agree to the risks and click **Install**

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-imanage
```

## Credentials

This node supports two authentication methods:

### Static Token (X-Auth-Token)
The simplest method - use a pre-generated authentication token.

### OAuth2 Password Grant
Use OAuth2 with client credentials and user password.

### Configuration Options
- **Base URL** - Your iManage instance URL (e.g., `https://cloudimanage.com`)
- **Customer ID** - Optional, will be auto-discovered if not provided
- **Default Library** - Optional, will use preferred library if not provided

## Usage Examples

### Download a Document

1. Add the iManage node to your workflow
2. Select **Document** as the resource
3. Select **Download** as the operation
4. Enter the document ID (e.g., `iManage!12345.1`)
5. The document will be available as binary data

### Search for Documents

1. Add the iManage node to your workflow
2. Select **Document** as the resource
3. Select **Search** as the operation
4. Enter your search query
5. Optionally filter by name, author, or extension

### Browse Workspace Contents

1. Add the iManage node to your workflow
2. Select **Workspace** as the resource
3. Select **Get Children** as the operation
4. Enter the workspace ID
5. This returns all folders and tabs at the workspace root

### Get Folder Contents

1. Add the iManage node to your workflow
2. Select **Folder** as the resource
3. Select **Get Children** as the operation
4. Enter the folder ID
5. This returns all subfolders and documents in the folder

## Document ID Format

iManage document IDs follow the format: `{library}!{documentNumber}.{version}`

Examples:
- `iManage!12345.1` - Document 12345, version 1, in the "iManage" library
- `ACTIVE!98765.3` - Document 98765, version 3, in the "ACTIVE" library

## API Reference

This node uses the iManage Work API v2. For more information, see the [iManage developer documentation](https://help.imanage.com/).

## Development

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Link for local development
npm link
cd ~/.n8n/nodes
npm link n8n-nodes-imanage
```

## License

MIT

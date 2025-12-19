# iManage n8n Connector - Object Model

## Core Objects

### Document
```typescript
interface Document {
  _type: 'imanage.document';

  // Identity
  id: string;                    // "ACTIVE!12345.1"
  documentNumber: number;        // 12345
  version: number;               // 1
  library: string;               // "ACTIVE"

  // Content
  name: string;                  // "Service Agreement"
  extension: string;             // "docx"
  size: number;                  // bytes
  pageCount?: number;

  // Classification
  class: string;                 // "DOCUMENT", "EMAIL", etc.
  subclass?: string;
  documentType?: string;         // "Contract", "Letter", etc.

  // Matter Context
  clientNumber?: string;         // custom1
  clientName?: string;
  matterNumber?: string;         // custom2
  matterName?: string;
  workspaceId?: string;
  workspaceName?: string;

  // People
  author: string;
  authorEmail?: string;
  operator?: string;             // last modifier

  // Dates
  createdDate: string;           // ISO 8601
  modifiedDate: string;

  // Capabilities (what can you do with this?)
  _capabilities: {
    canDownload: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canCheckout: boolean;
  };

  // For chaining - pre-built URLs
  _urls: {
    download: string;
    view: string;
    api: string;
  };
}
```

### Workspace
```typescript
interface Workspace {
  _type: 'imanage.workspace';

  // Identity
  id: string;                    // "ACTIVE!98765"
  library: string;

  // Info
  name: string;                  // "Smith v. Jones"
  description?: string;

  // Matter Context
  clientNumber?: string;
  clientName?: string;
  matterNumber?: string;
  matterName?: string;

  // People
  owner: string;

  // Dates
  createdDate: string;
  modifiedDate: string;

  // Stats
  documentCount?: number;
  folderCount?: number;

  // Capabilities
  _capabilities: {
    canAddDocuments: boolean;
    canCreateFolders: boolean;
    canDelete: boolean;
  };

  _urls: {
    view: string;
    api: string;
  };
}
```

### Folder
```typescript
interface Folder {
  _type: 'imanage.folder';

  // Identity
  id: string;
  library: string;

  // Info
  name: string;
  folderType: 'regular' | 'search' | 'tab';

  // Context
  workspaceId?: string;
  workspaceName?: string;
  parentFolderId?: string;
  path?: string;                 // "/Correspondence/Outgoing"

  // Stats
  documentCount?: number;
  subfolderCount?: number;

  // Capabilities
  _capabilities: {
    canAddDocuments: boolean;
    canCreateSubfolders: boolean;
    canDelete: boolean;
  };

  _urls: {
    view: string;
    api: string;
  };
}
```

### SearchCriteria
```typescript
interface SearchCriteria {
  _type: 'imanage.search';

  // Text search
  anywhere?: string;             // Full-text search
  name?: string;                 // Document name
  content?: string;              // Document content

  // Classification filters
  class?: string | string[];
  documentType?: string | string[];
  extension?: string | string[];

  // Matter filters
  clientNumber?: string;
  matterNumber?: string;
  workspaceId?: string;
  folderId?: string;

  // People filters
  author?: string;

  // Date filters
  createdAfter?: string;
  createdBefore?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;

  // Options
  includeEmails?: boolean;       // default: false
  limit?: number;                // default: 25
}
```

---

## Node Operations (Input → Output)

### Document Operations

| Operation | Input | Output |
|-----------|-------|--------|
| **Search Documents** | `SearchCriteria` or simple string | `Document[]` |
| **Get Document** | `Document` or document ID | `Document` |
| **Download Document** | `Document` or `Document[]` | Binary file(s) with Document metadata |
| **Get Document Text** | `Document` | `{document: Document, text: string}` |

### Workspace Operations

| Operation | Input | Output |
|-----------|-------|--------|
| **List Workspaces** | optional filters | `Workspace[]` |
| **Search Workspaces** | search string or criteria | `Workspace[]` |
| **Get Workspace** | `Workspace` or workspace ID | `Workspace` with stats |
| **Get Workspace Contents** | `Workspace` | `{folders: Folder[], documents: Document[]}` |

### Folder Operations

| Operation | Input | Output |
|-----------|-------|--------|
| **Get Folder** | `Folder` or folder ID | `Folder` with stats |
| **Get Folder Contents** | `Folder` | `{folders: Folder[], documents: Document[]}` |
| **Get Folder Documents** | `Folder` | `Document[]` (recursive option) |

### Bulk Operations

| Operation | Input | Output |
|-----------|-------|--------|
| **Download All** | `Document[]` or `Folder` or `Workspace` | Binary files + manifest |
| **Export Workspace** | `Workspace` | ZIP file with folder structure |

---

## Chaining Examples

### Search → Download → Upload to Drive
```
[Search Documents] → Document[] → [Download Document] → Binary[] → [Google Drive Upload]
     "contract"                         (auto-batches)                  (auto-names files)
```

### Get Workspace → List Contents → Filter → Download
```
[Get Workspace] → Workspace → [Get Contents] → Document[] → [Filter: PDFs] → [Download]
   "Smith v Jones"                                              extension=pdf
```

### New Document Trigger → Extract Text → AI Summary → Slack
```
[New Document Trigger] → Document → [Get Text] → string → [OpenAI] → [Slack Message]
     workspace: "..."                                         "Summarize"
```

---

## Triggers

### Change Event Queue (Preferred)

iManage provides a proper event queue at:
`GET /work/api/v2/customers/{customerId}/libraries/{libraryId}/change-events`

#### Event Object
```typescript
interface ChangeEvent {
  id: string;                    // Event ID (cursor position)
  action_type:
    | 'insert'                   // New object created
    | 'update'                   // Object modified
    | 'delete'                   // Object deleted
    | 'profile_update'           // Metadata changed
    | 'security_update'          // Permissions changed
    | 'document_link'            // Doc added to folder
    | 'document_unlink'          // Doc removed from folder
    | 'container_link'           // Folder added
    | 'container_unlink'         // Folder removed
    | 'container_move'           // Folder moved
    | 'declared' | 'undeclared'  // Records management
    | 'restored_from_trash'
    | 'purged_from_trash';
  item_type: 'document' | 'container' | 'user' | 'group' | 'worklist';
  object_id: string;             // e.g., "ACTIVE!50932.1"
  related_object_id?: string;    // For link events
  root_id?: string;              // Workspace ID
  event_date: string;            // ISO 8601
}
```

#### Queue Management
```typescript
// POST /change-events/queues - Create named queue
// GET /change-events/queues/{queueId} - Get last processed position
// PUT /change-events/queues/{queueId} - Update position (acknowledge events)
// DELETE /change-events/queues/{queueId} - Remove queue

interface QueueState {
  queue_id: string;              // e.g., "n8n-trigger-workspace-123"
  event_id: string;              // Last processed event cursor
  event_date: string;
}
```

#### Trigger Flow
1. **On first run**: Create queue, start from current position
2. **On poll**: `GET /change-events?cursor={last_event_id}&item_types=document&actions=insert,update`
3. **For each event**: Fetch full Document object, emit to workflow
4. **After processing**: `PUT /queues/{queueId}` with new cursor
5. **Handle overflow**: If `overflow: true`, continue polling

#### Trigger Configuration
```typescript
interface TriggerConfig {
  // What to watch
  workspaceIds?: string[];       // Filter by workspace (root_id)
  actions: string[];             // insert, update, delete, etc.
  itemTypes: string[];           // document, container

  // Polling
  pollIntervalSeconds: number;   // Default: 60

  // Queue
  queueName?: string;            // Auto-generated if not provided
}
```

#### Output
The trigger outputs **Document** or **Folder** objects (not raw events), enriched with:
```typescript
interface TriggerOutput {
  event: ChangeEvent;            // Original event
  object: Document | Folder;     // Full object with all fields
}
```

---

## Design Principles

1. **Objects know what they are** - `_type` field for runtime identification
2. **Objects know what you can do** - `_capabilities` for conditional logic
3. **Objects are ready to use** - `_urls` pre-built for common actions
4. **Operations accept flexible input** - ID string OR full object
5. **Search is smart** - Knows iManage Work search syntax, builds proper queries
6. **Batch operations are natural** - Pass Document[] to download, get files back
7. **Context flows through** - Workspace/matter info preserved through chain
8. **Triggers are stateful** - Track position in event stream, dedupe

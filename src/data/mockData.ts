import { FileNode, ProjectInfo, IndexStep, Branch } from '../stores/projectStore';

export const mockProjectInfo: ProjectInfo = {
  name: 'dental-lab-backend',
  repoUrl: 'https://github.com/example/dental-lab-backend',
  branch: 'main',
  stack: ['Java 21', 'Spring Boot 4.1', 'PostgreSQL', 'Maven', 'JPA/Hibernate'],
  version: '2.3.1',
  totalFiles: 147,
  totalFolders: 38,
  language: 'Java',
  lastIndex: '2025-01-15T10:30:00Z',
};

export const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: '.ai',
    type: 'folder',
    path: '.ai',
    expanded: true,
    children: [
      {
        id: '1-1',
        name: 'PROJECT_OVERVIEW.md',
        type: 'file',
        path: '.ai/PROJECT_OVERVIEW.md',
        content: `# Project Overview: dental-lab-backend

## Technology Stack
- **Language**: Java 21
- **Framework**: Spring Boot 4.1
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **ORM**: JPA / Hibernate

## Architecture
Layered Architecture with clear separation of concerns:
- Controller / API Layer
- Application / Service Layer
- Domain / Business Logic Layer
- Repository / Persistence Layer

## Project Structure
\`\`\`
com.example.dentallab
 ├── api/
 │    ├── controller/
 │    ├── dto/
 │    └── mapper/
 ├── application/
 │    └── service/
 ├── domain/
 │    ├── entity/
 │    ├── valueobject/
 │    ├── repository/
 │    └── exception/
 └── infrastructure/
      ├── persistence/
      └── configuration/
\`\`\`

## Key Modules
1. **Patient Management** - CRUD operations for patient records
2. **Dental Orders** - Order processing and tracking
3. **Lab Work** - Laboratory task management
4. **Billing** - Invoice and payment processing

## Dependencies
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- postgresql-driver
- spring-boot-starter-validation
- lombok
`,
      },
      {
        id: '1-2',
        name: 'src',
        type: 'folder',
        path: '.ai/src',
        expanded: false,
        children: [
          {
            id: '1-2-1',
            name: 'api',
            type: 'folder',
            path: '.ai/src/api',
            expanded: false,
            children: [
              {
                id: '1-2-1-1',
                name: 'controller',
                type: 'folder',
                path: '.ai/src/api/controller',
                expanded: false,
                children: [
                  {
                    id: '1-2-1-1-1',
                    name: 'PatientController.md',
                    type: 'file',
                    path: '.ai/src/api/controller/PatientController.md',
                    content: `# PatientController

## Location
\`com.example.dentallab.api.controller.PatientController\`

## Type
REST Controller

## Annotations
- \`@RestController\`
- \`@RequestMapping("/api/v1/patients")\`
- \`@Validated\`

## Dependencies (Imports)
- \`com.example.dentallab.application.service.PatientService\`
- \`com.example.dentallab.api.dto.CreatePatientRequest\`
- \`com.example.dentallab.api.dto.PatientResponse\`
- \`com.example.dentallab.api.mapper.PatientMapper\`
- \`jakarta.validation.Valid\`
- \`org.springframework.http.ResponseEntity\`

## Methods

### createPatient
- **HTTP**: POST /api/v1/patients
- **Input**: \`CreatePatientRequest\` (validated)
- **Output**: \`ResponseEntity<PatientResponse>\` (201 Created)
- **Description**: Creates a new patient record
- **Calls**: \`patientService.createPatient()\`

### getPatientById
- **HTTP**: GET /api/v1/patients/{id}
- **Input**: \`Long id\` (path variable)
- **Output**: \`ResponseEntity<PatientResponse>\` (200 OK)
- **Description**: Retrieves patient by ID
- **Calls**: \`patientService.getPatientById()\`

### getAllPatients
- **HTTP**: GET /api/v1/patients
- **Input**: Pagination parameters
- **Output**: \`ResponseEntity<Page<PatientResponse>>\` (200 OK)
- **Description**: Lists all patients with pagination
- **Calls**: \`patientService.getAllPatients()\`

### updatePatient
- **HTTP**: PUT /api/v1/patients/{id}
- **Input**: \`Long id\`, \`UpdatePatientRequest\` (validated)
- **Output**: \`ResponseEntity<PatientResponse>\` (200 OK)
- **Description**: Updates an existing patient
- **Calls**: \`patientService.updatePatient()\`

### deletePatient
- **HTTP**: DELETE /api/v1/patients/{id}
- **Input**: \`Long id\` (path variable)
- **Output**: \`ResponseEntity<Void>\` (204 No Content)
- **Description**: Deletes a patient record
- **Calls**: \`patientService.deletePatient()\`
`,
                  },
                  {
                    id: '1-2-1-1-2',
                    name: 'OrderController.md',
                    type: 'file',
                    path: '.ai/src/api/controller/OrderController.md',
                    content: `# OrderController

## Location
\`com.example.dentallab.api.controller.OrderController\`

## Type
REST Controller

## Annotations
- \`@RestController\`
- \`@RequestMapping("/api/v1/orders")\`
- \`@Validated\`

## Dependencies (Imports)
- \`com.example.dentallab.application.service.OrderService\`
- \`com.example.dentallab.api.dto.CreateOrderRequest\`
- \`com.example.dentallab.api.dto.OrderResponse\`
- \`com.example.dentallab.api.mapper.OrderMapper\`
- \`jakarta.validation.Valid\`

## Methods

### createOrder
- **HTTP**: POST /api/v1/orders
- **Input**: \`CreateOrderRequest\` (validated)
- **Output**: \`ResponseEntity<OrderResponse>\` (201 Created)
- **Description**: Creates a new dental order
- **Calls**: \`orderService.createOrder()\`

### getOrderById
- **HTTP**: GET /api/v1/orders/{id}
- **Input**: \`Long id\` (path variable)
- **Output**: \`ResponseEntity<OrderResponse>\` (200 OK)
- **Description**: Retrieves order by ID
- **Calls**: \`orderService.getOrderById()\`

### updateOrderStatus
- **HTTP**: PATCH /api/v1/orders/{id}/status
- **Input**: \`Long id\`, \`UpdateStatusRequest\`
- **Output**: \`ResponseEntity<OrderResponse>\` (200 OK)
- **Description**: Updates order status with state machine validation
- **Calls**: \`orderService.updateOrderStatus()\`
`,
                  },
                ],
              },
              {
                id: '1-2-1-2',
                name: 'dto',
                type: 'folder',
                path: '.ai/src/api/dto',
                expanded: false,
                children: [
                  {
                    id: '1-2-1-2-1',
                    name: 'CreatePatientRequest.md',
                    type: 'file',
                    path: '.ai/src/api/dto/CreatePatientRequest.md',
                    content: `# CreatePatientRequest

## Location
\`com.example.dentallab.api.dto.CreatePatientRequest\`

## Type
Record (Java 21)

## Fields
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| firstName | String | @NotBlank @Size(max=100) | Patient first name |
| lastName | String | @NotBlank @Size(max=100) | Patient last name |
| nationalId | String | @NotBlank @Pattern(regexp="\\\\d{10}") | 10-digit national ID |
| phone | String | @NotBlank @Pattern(regexp="09\\\\d{9}") | Iranian phone number |
| dateOfBirth | LocalDate | @NotNull @Past | Date of birth |

## Used By
- PatientController.createPatient()

## Maps To
- Patient entity via PatientMapper
`,
                  },
                ],
              },
            ],
          },
          {
            id: '1-2-2',
            name: 'application',
            type: 'folder',
            path: '.ai/src/application',
            expanded: false,
            children: [
              {
                id: '1-2-2-1',
                name: 'service',
                type: 'folder',
                path: '.ai/src/application/service',
                expanded: false,
                children: [
                  {
                    id: '1-2-2-1-1',
                    name: 'PatientService.md',
                    type: 'file',
                    path: '.ai/src/application/service/PatientService.md',
                    content: `# PatientService

## Location
\`com.example.dentallab.application.service.PatientService\`

## Type
Spring Service

## Annotations
- \`@Service\`
- \`@Transactional\` (class-level, overridden per method)

## Dependencies
- \`PatientRepository\` (injected via constructor)
- \`PatientMapper\` (injected via constructor)

## Business Rules
1. National ID must be unique across all patients
2. Phone number must follow Iranian format (09XXXXXXXXX)
3. Patient cannot be deleted if they have active orders

## Methods

### createPatient(CreatePatientRequest)
- **Transaction**: Required
- **Business Logic**:
  1. Validate national ID uniqueness
  2. Map request to entity
  3. Save to database
  4. Map entity to response
- **Throws**: \`DuplicateNationalIdException\` if ID exists
- **Returns**: \`PatientResponse\`

### getPatientById(Long)
- **Transaction**: Read-only
- **Business Logic**:
  1. Find patient by ID
  2. Throw if not found
  3. Map to response
- **Throws**: \`PatientNotFoundException\`
- **Returns**: \`PatientResponse\`

### getAllPatients(Pageable)
- **Transaction**: Read-only
- **Returns**: \`Page<PatientResponse>\`

### updatePatient(Long, UpdatePatientRequest)
- **Transaction**: Required
- **Business Logic**:
  1. Find existing patient
  2. Update fields
  3. Save and return
- **Throws**: \`PatientNotFoundException\`
- **Returns**: \`PatientResponse\`

### deletePatient(Long)
- **Transaction**: Required
- **Business Logic**:
  1. Find patient
  2. Check for active orders
  3. Delete if no active orders
- **Throws**: \`PatientNotFoundException\`, \`PatientHasActiveOrdersException\`
`,
                  },
                ],
              },
            ],
          },
          {
            id: '1-2-3',
            name: 'domain',
            type: 'folder',
            path: '.ai/src/domain',
            expanded: false,
            children: [
              {
                id: '1-2-3-1',
                name: 'entity',
                type: 'folder',
                path: '.ai/src/domain/entity',
                expanded: false,
                children: [
                  {
                    id: '1-2-3-1-1',
                    name: 'Patient.md',
                    type: 'file',
                    path: '.ai/src/domain/entity/Patient.md',
                    content: `# Patient Entity

## Location
\`com.example.dentallab.domain.entity.Patient\`

## Table
\`patients\`

## Fields
| Column | Type | Constraints |
|--------|------|-------------|
| id | Long | PK, Generated (IDENTITY) |
| firstName | String | NOT NULL, max 100 |
| lastName | String | NOT NULL, max 100 |
| nationalId | String | NOT NULL, UNIQUE, length 10 |
| phone | String | NOT NULL, length 11 |
| dateOfBirth | LocalDate | NOT NULL |
| createdAt | LocalDateTime | NOT NULL, auto |
| updatedAt | LocalDateTime | auto |

## Relationships
- \`orders\`: OneToMany -> Order (LAZY, mappedBy="patient")

## Database Constraints
- UNIQUE(national_id)
- CHECK(length(national_id) = 10)
- CHECK(length(phone) = 11)

## Indexes
- idx_patient_national_id (UNIQUE)
- idx_patient_last_name
`,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const mockIndexSteps: IndexStep[] = [
  { id: 1, label: 'indexer.step1', status: 'completed', progress: 100 },
  { id: 2, label: 'indexer.step2', status: 'completed', progress: 100 },
  { id: 3, label: 'indexer.step3', status: 'completed', progress: 100 },
  { id: 4, label: 'indexer.step4', status: 'completed', progress: 100 },
  { id: 5, label: 'indexer.step5', status: 'completed', progress: 100 },
];

export const mockBranches: Branch[] = [
  {
    id: '1',
    name: 'main',
    isCurrent: true,
    createdAt: '2025-01-10T08:00:00Z',
    lastUpdated: '2025-01-15T10:30:00Z',
    commitCount: 42,
  },
  {
    id: '2',
    name: 'feature/ai-indexer',
    isCurrent: false,
    createdAt: '2025-01-12T14:00:00Z',
    lastUpdated: '2025-01-14T16:45:00Z',
    commitCount: 8,
  },
  {
    id: '3',
    name: 'fix/patient-validation',
    isCurrent: false,
    createdAt: '2025-01-13T09:00:00Z',
    lastUpdated: '2025-01-13T11:20:00Z',
    commitCount: 3,
  },
];

export function mdToJson(mdContent: string): object {
  const lines = mdContent.split('\n');
  const result = {
    title: '',
    sections: [] as Array<{ heading: string; content: string }>,
    tables: [] as Array<{ headers: string[]; rows: string[][] }>,
    codeBlocks: [] as string[],
  };

  let currentSection = '';
  let currentContent = '';
  let inCodeBlock = false;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.codeBlocks.push(currentContent.trim());
        currentContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      currentContent += line + '\n';
      continue;
    }

    if (line.startsWith('# ')) {
      result.title = line.replace('# ', '');
      continue;
    }

    if (line.startsWith('## ')) {
      if (currentSection) {
        (result.sections as Array<{ heading: string; content: string }>).push({
          heading: currentSection,
          content: currentContent.trim(),
        });
      }
      currentSection = line.replace('## ', '');
      currentContent = '';
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter((c) => c.trim()).map((c) => c.trim());
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else if (cells.every((c) => c.match(/^[-:]+$/))) {
        // separator row, skip
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      (result.tables as Array<{ headers: string[]; rows: string[][] }>).push({
        headers: tableHeaders,
        rows: tableRows,
      });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }

    currentContent += line + '\n';
  }

  if (currentSection) {
    (result.sections as Array<{ heading: string; content: string }>).push({
      heading: currentSection,
      content: currentContent.trim(),
    });
  }

  if (inTable && tableHeaders.length > 0) {
    (result.tables as Array<{ headers: string[]; rows: string[][] }>).push({
      headers: tableHeaders,
      rows: tableRows,
    });
  }

  return result;
}

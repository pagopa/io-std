# @pagopa/handler-kit-azure-func

## 1.2.0

### Minor Changes

- 576341b: azureFunction now throws on error, in order to be compatible with retry mechanism of Azure

### Patch Changes

- 6550d4c: Now functions triggered by blobTrigger returns their metadata instead of the wrong payload

## 1.1.1

### Patch Changes

- cf6f784: Upgrade logger version to 1.0.1
- Updated dependencies [cf6f784]
  - @pagopa/handler-kit@1.0.1

## 1.1.0

### Minor Changes

- a4f8ecb: Add support for cosmosDBTrigger

## 1.0.0

### Major Changes

- d484bd0: Add support for Azure Functions

### Patch Changes

- Updated dependencies [d484bd0]
- Updated dependencies [d484bd0]
  - @pagopa/logger@1.0.0
  - @pagopa/handler-kit@1.0.0

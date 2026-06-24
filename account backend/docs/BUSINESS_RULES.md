# Business Rules

This document defines the strict operational rules governing the system's logic. These rules must be enforced exclusively within the backend Service/Controller layers.

## Authentication & Authorization Rules
- **Authentication**: All API requests (except login/registration) must contain a valid JWT in the `Authorization: Bearer <token>` header.
- **Role-Based Access**: Certain destructive actions (e.g., deleting a warehouse or branch) require specific roles (e.g., `COMPANY_ADMIN`).
- **Data Isolation**: A user can only fetch, modify, or delete records associated with their assigned `companyId` and `branchId`.

## Validation Rules
- **Duplicate Prevention**: Entities like Company, Branch, User, and Product require unique identifiers (e.g., email, GSTIN, product code). The backend must return a 409 Conflict if duplicates are detected.
- **Stock Validation**: Sales and Stock Transfers cannot exceed the currently available stock in the specified warehouse. The backend must reject such requests with a 409 Conflict.
- **Quantity Validation**: Quantities in transactions (Purchases, Sales, Adjustments) must be strictly greater than 0.
- **GST Validation**: Where GST is enabled via settings, the provided GST percentages must be valid predefined slabs.
- **Branch/Warehouse Validation**: Transactions must specify valid, active `branchId` and `warehouseId` values that belong to the user's company.

## Inventory State Transitions & Movement Rules
The system strictly decouples inventory movement into specific transaction types:

- **Purchase**: **Increases** stock in the target warehouse.
- **Purchase Return**: **Decreases** stock in the origin warehouse.
- **Sales**: **Decreases** stock in the origin warehouse.
- **Sales Return**: **Increases** stock in the target warehouse.
- **Stock Transfer**: Modifies stock across two warehouses. It **decreases** stock in the origin warehouse and **increases** it in the destination warehouse. *Crucially, this has no financial impact.*
- **Stock Adjustment**: Manually overwrites or adjusts the absolute quantity in a warehouse. Used for loss, damage, or audit reconciliation. *No financial entry is created.*

## Financial Rules
Financial tracking runs parallel to inventory movements but responds only to specific triggers:

- **Purchase**: Creates a **payable** (Money Out obligation) entry against the specific supplier/company.
- **Sales**: Creates a **receivable** (Money In obligation) entry against the specific customer.
- **Collection Reports**: These reports do not generate entries; they aggregate data. They calculate Net Collection based strictly on recorded Payment In (receivables cleared) and Payment Out (payables cleared) records.

## Quotation Rules
- **No Inventory Movement**: Creating a quotation does not reserve or deduct stock.
- **No Accounting Entry**: Quotations do not create payables or receivables.
- **Conversion**: A Quotation can be converted into a Sales transaction. Only at the point of conversion do the Inventory (decrease stock) and Financial (create receivable) rules apply.

## Loading Sheet Rules
- **Dispatch Only**: Loading sheets represent physical logistics and dispatch planning.
- **No Accounting Entry**: Creating or fulfilling a loading sheet has zero financial impact.
- **No Ownership Change**: Stock remains under company ownership until the actual Sales Invoice is marked as fulfilled/delivered, depending on the organizational workflow.

## Settings & Configuration Rules
The system behaviors (especially in the Purchase Order and Sales screens) are driven entirely by dynamic backend settings, preventing UI hardcoding.

- **Overrides**: Settings follow a hierarchy. User-specific settings override Branch-specific settings, which override Company-specific defaults.
- **Database Persistence**: Settings (e.g., `Show GST`, `Party First`, `Default Warehouse`) must be fetched from the database on UI load.
- **Enforcement**: If a setting like `Negative Stock Lock` is set to TRUE, the backend must rigidly block transactions that result in negative stock, returning a 409 Conflict. If FALSE, the backend allows the transaction but may flag it.

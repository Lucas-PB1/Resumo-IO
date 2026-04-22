# Account API Routes Reference

> All routes require JWT authentication via Bearer token.
> Header: `Authorization: Bearer <token>`

---


## 1 Authorized Contacts

Base path: `/authorized-contacts`

### GET /authorized-contacts

Returns all authorized contacts for the authenticated client.

**Response `200`**

```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "passportOrLicense": "AB1234567",
    "dateOfBirth": "1990-05-15",
    "email": "john.doe@example.com",
    "phone": "+55.11999999999",
    "password": "",
    "supportPin": "12345",
    "status": 1,
    "permissions": {
      "invoices": { "read": true, "create": false, "update": false, "delete": false, "export": true },
      "servers": { "read": true, "create": true, "update": true, "delete": false, "export": true },
      "domains": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "creditCard": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "credits": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "authorizedContacts": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "cloud": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "ipWhitelist": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "accountMigration": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "remoteStorage": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "ssl": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "monitoring": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "managedNetworks": { "read": false, "create": false, "update": false, "delete": false, "export": false },
      "nullRoutes": { "read": false, "create": false, "update": false, "delete": false, "export": false }
    }
  }
]
```

**Errors:** `401`, `500`

---

### GET /authorized-contacts/:id

Returns a single authorized contact by its numeric ID.

**Path Parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | Numeric ID of the contact |

**Response `200`** — single contact object (same shape as array item above).

**Errors:** `400` (invalid ID), `404` (not found)

---

### POST /authorized-contacts

Creates a new authorized contact for the authenticated client.

**Request Body**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+55.11999999999",
  "supportPin": "56789",
  "permissions": {
    "invoices": { "read": true, "create": false, "update": false, "delete": false, "export": false },
    "servers": { "read": true, "create": true, "update": true, "delete": false, "export": true }
  },
  "password": "Str0ngP@ss",
  "passportOrLicense": "CD9876543",
  "dateOfBirth": "1985-03-20",
  "status": 1
}
```

| Field            | Type   | Required | Description                                              |
|------------------|--------|----------|----------------------------------------------------------|
| firstName        | string | Yes      | Contact first name                                       |
| lastName         | string | Yes      | Contact last name                                        |
| email            | string | Yes      | Email (unique within the account)                        |
| phone            | string | Yes      | Phone in `+CC.NUMBER` format                             |
| supportPin       | string | Yes      | Exactly 5 numeric digits                                 |
| permissions      | object | Yes      | Permission subjects with CRUD + export actions           |
| password         | string | No       | Min 8 chars, upper+lower+digit, no name/email parts      |
| passportOrLicense| string | No       | Government ID / passport number                          |
| dateOfBirth      | string | No       | Date of birth (YYYY-MM-DD)                               |
| status           | number | No       | Contact status (default: 1)                              |

**Response `201`** — created contact object (same shape as GET response).

**Errors:** `400`, `401`, `500`

---

### PUT /authorized-contacts/:id

Partially updates an existing authorized contact.

**Path Parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | Numeric ID of the contact |

**Request Body** — all fields optional, send only what needs updating:

```json
{
  "firstName": "Jane Updated",
  "lastName": "Smith",
  "email": "jane.updated@example.com",
  "phone": "+55.11988888888",
  "supportPin": "99999",
  "permissions": {
    "invoices": { "read": true, "create": true, "update": true, "delete": false, "export": true }
  },
  "password": "NewStr0ng",
  "passportOrLicense": "CD9876543",
  "dateOfBirth": "1985-03-20",
  "status": 1
}
```

| Field            | Type   | Required | Description                                          |
|------------------|--------|----------|------------------------------------------------------|
| firstName        | string | No       | Contact first name                                   |
| lastName         | string | No       | Contact last name                                    |
| email            | string | No       | Email (triggers re-validation if changed)            |
| phone            | string | No       | Phone in `+CC.NUMBER` format                         |
| supportPin       | string | No       | Exactly 5 numeric digits                             |
| permissions      | object | No       | Permission subjects with CRUD + export actions       |
| password         | string | No       | Omit to keep current password                        |
| passportOrLicense| string | No       | Government ID / passport number                      |
| dateOfBirth      | string | No       | Date of birth (YYYY-MM-DD)                           |
| status           | number | No       | Contact status                                       |

**Response `200`** — updated contact object (same shape as GET response).

**Errors:** `400` (invalid ID or validation), `404` (not found), `500`

---

### DELETE /authorized-contacts/:id

Soft-deletes an authorized contact by ID.

**Path Parameters**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | Numeric ID of the contact |

**Response `200`**

```json
{
  "success": true
}
```

**Errors:** `400` (invalid ID), `404` (not found), `500`

---

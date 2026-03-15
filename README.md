# User Management API

A REST API for managing users and products built with Node.js, Express, and SQLite.

## Features

- **User Management**: CRUD operations for users with SQLite database
- **Product Management**: Full CRUD operations for products
- **User Filtering**: Search by name, filter adults, filter by minimum age
- **Data Validation**: Comprehensive input validation
- **Active Users**: Query only active users by default
- **Email Extraction**: Get all user emails

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

## Usage

Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

The server will run on `http://localhost:3000`

## Database

The API uses SQLite database (`database.db`) which is created automatically on first run.

## API Endpoints

### Users

- `GET /users` - Get all active users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

### User Filtering

- `GET /users/search?name=<name>` - Search active users by name
- `GET /users/adults` - Get active users with age >= 18
- `GET /users/age/:min` - Get active users older than specified age
- `GET /users/emails` - Get all emails from active users

### Products

- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create a new product
- `PUT /products/:id` - Update a product
- `DELETE /products/:id` - Delete a product

### User Schema

```json
{
  "id": "integer (auto-increment)",
  "name": "string",
  "email": "string (unique)",
  "age": "integer (optional)",
  "isActive": "boolean (default: true)"
}
```

### Product Schema

```json
{
  "id": "integer (auto-increment)",
  "name": "string",
  "price": "number",
  "category": "string"
}
```

## Validation

### Users
- Name: Required, non-empty string
- Email: Required, must contain '@', unique
- Age: Optional, must be a non-negative integer
- isActive: Optional, boolean (defaults to true)

### Products
- Name: Required, non-empty string
- Price: Required, non-negative number
- Category: Required, non-empty string

## Testing with Postman

### Create Users
```bash
POST /users
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 25,
  "isActive": true
}
```

### Create Products
```bash
POST /products
{
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics"
}
```

### Filter Users
- `GET /users/adults` - Users 18+
- `GET /users/age/30` - Users older than 30
- `GET /users/search?name=John` - Search by name
# User Management API

A simple REST API for managing users built with Node.js and Express.

## Features

- CRUD operations for users (Create, Read, Update, Delete)
- In-memory storage
- Input validation
- Search users by name
- Filter adult users (age >= 18)
- Get all user emails

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

## API Endpoints

### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

### Additional Endpoints

- `GET /users/search?name=<name>` - Search users by name
- `GET /users/adults` - Get users with age >= 18
- `GET /users/emails` - Get all user emails

### User Schema

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "age": "number (optional)"
}
```

## Testing with Postman

1. Start the server
2. Use Postman to test the endpoints
3. Example requests:
   - POST /users with body: `{"name": "John Doe", "email": "john@example.com", "age": 25}`
   - GET /users to see all users
   - PUT /users/:id to update
   - DELETE /users/:id to delete

## Validation

- Name: Required, non-empty string
- Email: Required, must contain '@'
- Age: Optional, must be a non-negative number
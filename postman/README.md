# Studify Mobile API - Postman Collections

This directory contains Postman collections for the Studify mobile API endpoints.

## Collections

### 1. Studify_Mobile_Student.postman_collection.json
Complete API collection for **Student** mobile app.

**Includes:**
- Profile Management (Get, Update, Upload Avatar, Change Password)
- Books (Browse, View Details, Print Options)
- Products (Browse, View Details)
- Categories (Book & Product Categories)
- Colleges & Departments (Filtering)
- Orders (Create, View, Cancel)
- Reviews (Create, Update, Delete)
- Notifications (Get, Mark as Read)

### 2. Studify_Mobile_Doctor.postman_collection.json
Complete API collection for **Doctor** mobile app.

**Includes:**
- Profile Management (Get, Update, Upload Avatar, Change Password)
- My Books (CRUD operations)
- Book Pricing (Add, Update, Delete pricing options)
- Book Statistics (Orders, Reviews, Revenue)
- Book Reviews (View reviews for doctor's books)
- Orders (View orders for doctor's books)
- Categories & Filters (Colleges, Departments)
- Notifications (Get, Mark as Read)

### 3. Studify_Mobile_Delivery.postman_collection.json
Complete API collection for **Delivery** mobile app.

**Includes:**
- Profile Management (Get, Update)
- Status Management (Update delivery status)
- Assignments (Get assignments, View details)
- Order Management (Mark picked up, Mark delivered)
- Location Tracking (Update location, View history)
- Wallet (View balance, View transactions)
- Notifications (Get, Mark as Read)

## How to Import

1. Open Postman
2. Click **Import** button (top left)
3. Select the JSON file(s) you want to import
4. Click **Import**

## Configuration

### Setting Base URL

Each collection has a `base_url` variable that defaults to:
```
https://back-studify.developteam.site/api
```

To change it:
1. Click on the collection name
2. Go to **Variables** tab
3. Update the `base_url` value

### Setting Authentication Token

1. First, login using the Authentication endpoints (from main collection)
2. Copy the `token` from the response
3. In Postman:
   - Click on the collection name
   - Go to **Variables** tab
   - Set the `token` value

Alternatively, you can set it at the environment level if you're using Postman environments.

## Authentication

All endpoints require Bearer token authentication. The token is automatically included in requests via the collection-level auth configuration.

**To get a token:**
1. Use the Authentication collection (from main Studify API collection)
2. Call the `Login` endpoint
3. Copy the token from the response
4. Set it in the collection variables

## Base URL

Default base URL: `https://back-studify.developteam.site/api`

For local development, change the `base_url` variable to:
```
http://localhost:3001/api
```

## Notes

- All endpoints return full image URLs (automatically transformed for mobile)
- Pagination is supported on list endpoints (default: page=1, limit=10)
- All date fields are in ISO 8601 format
- UUIDs are used for all IDs

## Testing Workflow

1. **Import the collection** you need (Student, Doctor, or Delivery)
2. **Set the base_url** variable (if different from default)
3. **Login** using the Authentication endpoints to get a token
4. **Set the token** in collection variables
5. **Start testing** the endpoints!

## Support

For API documentation and support, refer to the main Studify API documentation.


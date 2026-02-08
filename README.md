# Coffee Shop Backend

## Installation
1. npm install
2. Copy .env.example to .env
3. Fill in your MongoDB URI and JWT_SECRET
4. npm run dev

## API Endpoints

### Authentication
POST /api/auth/register - Register new user
POST /api/auth/login - Login user

### Users (protected)
GET /api/users/profile - Get user profile
PUT /api/users/profile - Update user profile

### Products
GET /api/products - Get all products
GET /api/products/:id - Get single product
POST /api/products - Create product (protected)
PUT /api/products/:id - Update product (protected)
DELETE /api/products/:id - Delete product (protected)
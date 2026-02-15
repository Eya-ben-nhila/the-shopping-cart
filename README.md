# Persistent E-commerce Cart System

An e-commerce platform with a persistent shopping cart that survives browser closes, server restarts, and supports multiple users.

## Features

- **Browser Persistence**: Cart survives browser close/reopen using localStorage
- **Server Persistence**: Cart survives server restarts using file-based storage
- **Multi-user Support**: Different browsers/sessions maintain separate carts
- **Auto-cleanup**: Cart items expire after 7 days of inactivity
- **No Authentication Required**: Uses session-based identification

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Architecture

- **Frontend**: HTML/CSS/JavaScript with localStorage for client-side persistence
- **Backend**: Express.js with file-based session storage
- **Cart Storage**: Dual persistence (localStorage + server-side files)
- **Session Management**: UUID-based session identification
- **Cleanup**: Automatic removal of carts older than 7 days

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/cart` - Get current user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

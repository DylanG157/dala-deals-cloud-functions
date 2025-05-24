# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Lint the codebase
npm run lint

# Deploy functions to Firebase
npm run deploy
```

Note: No test commands are configured in this project.

## Architecture Overview

This is a Firebase Cloud Functions project that provides backend services for the Dala Deals platform. The functions are organized into distinct service domains:

### Service Domains

1. **Order Services** (`src/lib/order-services/`)
   - Handles order lifecycle: creation, updates, deletion, fetching, and redemption
   - Key functions: `createOrder`, `redeemOrder`, `fetchOrdersByVendor`, `fetchOrdersByClient`

2. **Dala Bags Services** (`src/lib/dala-bags-services/`)
   - Manages Dala Bag entities (CRUD operations)
   - Functions: `createDalaBag`, `updateDalaBag`, `deleteDalaBag`

3. **User Services** (`src/lib/user-services/`)
   - User profile management and vendor associations
   - Functions include profile CRUD and vendor-user relationships

4. **Vendor Services** (`src/lib/vendor-services/`)
   - Vendor management and employee invitations
   - Handles vendor CRUD and employee relationships

5. **Payment Services** (`src/lib/payment-services/`)
   - PayFast payment gateway integration
   - Functions: `initiatePayfastPayment`, `payfastNotify`

### Technical Details

- **Runtime**: Node.js 22 with Firebase Functions v6.3.2
- **Language**: TypeScript 5.8.2 (strict mode enabled)
- **Module System**: CommonJS
- **Database**: Firebase Admin SDK for Firestore access
- **Additional Dependencies**: SendGrid for emails, nanoid for ID generation

All functions are exported from `src/index.ts` and compiled to `lib/` directory. The project uses ESLint with Google style guide for code quality.
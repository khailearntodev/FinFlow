# 🌊 FinFlow - Family Financial Management System

FinFlow is a smart financial management and shared expense tracking application specifically designed for families or co-living groups. The system ensures transparency for all expenditures, automatically calculates shared debts, and simplifies the monthly settlement process.

## 🚀 Core Features

### 1. Family & Group Management
- **Create/Join Groups**: Easily create a shared space for your family and invite members via Email.
- **Flexible Billing Cycle**: The Head of Family can customize the monthly settlement date (Billing Date) to align with the household's income cycle.

### 2. Smart Expense Tracking
- **Flexible Split Logic**: Support splitting expenses equally among everyone or selecting specific participants for a particular expense.
- **Secure Data Locking**: Once expenses are settled for the billing cycle, they are locked (`SETTLED`) to ensure transparency and prevent unauthorized modifications.

### 3. Automated Settlement
- **Smart Offset Algorithm**: Automatically calculates the net balance based on actual amounts paid and the required contribution for each member.
- **Centralized Payment Model**: All cash flows are consolidated and directed to a single point of contact: the **Head of Family**.
- **Automated Scheduling**: Automatically runs the settlement process at 00:00 on the configured billing date via Cronjobs.

### 4. Transparent Payment Workflow
- **Proof of Transfer**: Members are required to upload transaction receipts/images when reporting a payment.
- **Payment Verification**: The Head of Family directly reviews the proof of transfer and approves it to clear the debt.

### 5. Audit Trail
- Maintains a comprehensive history of all financial actions (Create/Update/Delete), including old and new values, ensuring easy reconciliation when needed.

---

## 👥 User Roles & Permissions

| Role | Key Permissions |
| :--- | :--- |
| **Head of Family** | Create family groups, set billing dates, pay shared bills (electricity, water, etc.), approve payment proofs, and cancel settlements if errors occur. |
| **Member** | Join family groups, add personal expenses for shared purposes, track personal debt reports, and submit payment proofs. |

---

## 🛠 Tech Stack

### Backend (Java Ecosystem)
- **Spring Boot 3.x**: Primary framework for the core server.
- **Spring Security & JWT**: Secure authentication and authorization.
- **Spring Data JPA**: Efficient database interactions and ORM.
- **PostgreSQL**: Relational database management system.

### Frontend (Modern Web)
- **Next.js 16 (App Router)**: Powerful React framework for the client application.
- **TypeScript**: Ensures type safety across the frontend.
- **Tailwind CSS**: Modern and responsive UI design.
- **Lucide React & Heroicons**: Elegant and consistent icon sets.

### Storage & Infrastructure
- **Cloudinary / Supabase Storage**: Secure storage for payment receipts and images.
- **Docker & Docker Compose**: Easy application packaging and deployment.

---

## ⚙️ Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Java 17+ (for local backend development)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FinFlow
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory, `finflow-backend`, and `finflow-frontend` based on their respective `.env.example` files.

3. **Deploy with Docker**:
   ```bash
   docker compose up --build
   ```

4. **Access the Application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080/api`

---

## 🛡 Security & Data Integrity
- **Data Isolation**: Ensures complete data separation between different families.
- **Strict Permission Checks**: Service-layer validation (e.g., Members cannot approve their own payments).
- **Transaction Management**: Critical financial operations are strictly executed as atomic database transactions to prevent partial updates.

---
*Developed by khailearntodev.*

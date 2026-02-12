# Classroom Companion - Role-Based Foundation

This project is a React-based web application with role-based access control using Supabase Authentication.

## Features

### 1. Authentication
-   **Public Homepage**: Accessible without login.
-   **Protected Dashboard**: Accessible only after login.

### 2. User Management
-   **Automatic User Creation**: When a user signs in for the first time, a trigger in Supabase## 🏗️ Architecture: T1xx Schema

The application uses a modular, prefix-based database schema for role-based access control (RBAC).

### Database Tables (Supabase)
| Table | Description | status |
| :--- | :--- | :--- |
| `t101_application_roles` | **Master Table**: Defines all application roles (e.g., `developer`, `program_office`, `student`, etc.). | ✅ |
| `t102_dashboard_tiles` | **Master Table**: Top-level dashboard modules (e.g., Onboard Batch, Attendance Hub). | ✅ |
| `t103_dashboard_subtiles` | **Master Table**: Child navigation items under each top-level tile. | ✅ |
| `t104_role_tile_access` | **Intersection Table**: Maps `t101` roles to `t102` tiles (Access Control List). | ✅ |
| `t105_role_subtile_access` | **Intersection Table**: Granular access control for `t103` subtiles. | ✅ |
| `t106_user_profile` | **User Data**: Extends `auth.users` with role (`primary_role`), approval status (`access_status`), and profile fields. | ✅ |
| `t107_login_history` | **Audit Log**: Tracks login events, IP addresses, and user agent strings. | 🚧 (Partially Implemented) |

### 🔐 Authentication Flow
1.  **Google OAuth**: Users sign in via Google.
2.  **Auto-Registration**: A Supabase Trigger (`handle_new_user`) automatically creates a `t106_user_profile` entry with the default role `user`.
3.  **Role Guard**: The frontend `useAuth` hook fetches the user's `primary_role` from `t106`.
4.  **Dashboard**: Tiles are dynamically filtered based on `t104` permissions for that role.

### 🎨 Frontend Structure
*   **Tech Stack**: Vite, React, TypeScript, Tailwind CSS, Shadcn UI, Supabase Client.
*   **Key Components**:
    *   `Dashboard.tsx`: Generates the UI based on role permissions. Use `t104` logic here.
    *   `useAuth.tsx`: Centralized auth state management.
    *   `ProtectedRoute`: Wrapper component to enforce auth requirements.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Supabase Project

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables in `.env`:
    ```
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
    ```
4.  Run SQL Migrations in Supabase Dashboard (found in `database/supabase/migrations`).

### Running Locally
```bash
npm run dev
```

## 📝 Next Steps (Planned)
1.  **Role Request Workflow**: Allow new users (default `user` role) to request elevation (e.g., to `student` or `faculty`) via the Dashboard.
2.  **Audit Logging**: Implement logic to populate `t107_login_history` on successful logins.
3.  **Tile Implementation**: Build out the actual screens for "Onboard Batch" and "Manage Courses".
-   **Role persistence**: Roles are stored in the `public.users` table. Default role is `USER`.

### 3. Role-Based Dashboard
The dashboard displays different "tiles" based on the user's role:
-   **PROGRAM_OFFICE**: Can see "Onboard Batch", "Manage Courses", "Attendance Hub".
-   **DEVELOPER**: Can see all Program Office tiles plus "System Settings".
-   **USER**: Sees a placeholder message until assigned a role.

## Setup Instructions

### Prerequisites
-   Node.js & npm/bun
-   Supabase Project

### Database Setup
1.  Go to your Supabase Dashboard -> SQL Editor.
2.  Run the migration script located at `database/supabase/migrations/20260208110000_create_users_foundation.sql`.
    -   This creates the `users` table.
    -   Sets up the trigger to sync new users from Auth to Public table.

### Environment Variables
Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Running Locally
```bash
npm install
npm run dev
```

## detailed Role Logic
-   **Student/User**: Default role. Limited access.
-   **Program Office**: Administrative access for batch/course management.
-   **Developer**: Full system access.

To change a user's role, an admin/developer must manually update the `role` column in the `public.users` table in Supabase.

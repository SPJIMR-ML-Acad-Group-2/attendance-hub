# Classroom Companion - Role-Based Foundation

This project is a React-based web application built with a focus on Role-Based Access Control (RBAC) and a clean, responsive UI. It serves as the academic operations platform for SPJIMR.

## 🚀 Recent Updates (Progress Log)

### Authentication & Session Management
-   **Mock Authentication Flow**: Implemented a "Dev Sign In" that mimics the Google Auth experience for rapid localized development.
-   **Session Persistence**: Added `localStorage` based session management to ensure:
    -   Users stay logged in on page refresh.
    -   Role state is preserved across reloads.
    -   Logout correctly clears all local state.
-   **Routing**: Fixed routing logic (`ProtectedRoute`, `PublicOnlyRoute`) to respect the persisted session state and prevent unwanted "auto-logins" or redirects.

### UI/UX Enhancements
-   **Homepage Redesign**: Refactored `HomePage.tsx` to use a **2-Column Layout** on desktop, fixing vertical spacing issues and improving information density.
-   **Visual Consistency**:
    -   **Fonts**: Standardized the entire application to use a single sans-serif font (`Inter`) for a clean, modern look.
    -   **Logo Handling**: Implemented a robust fallback mechanism for the logo. If the image fails to load, a default graduation cap icon is displayed.
    -   **Icons**: Added visual cues (e.g., specific icons for tiles, "Sign In" icon) to improve usability.
-   **Navigation**: Made the Logo and "Classroom Companion" text in headers clickable, navigating users to the appropriate home/dashboard view.

### Feature: Request Access
-   **Request Access Flow**: Implemented a form for users with the default `USER` role to request elevation to `STUDENT`, `FACULTY`, or `TA`.
-   **Request History**: Added a dedicated `RequestHistory` page where users can track the status of their submitted requests (Approved, Rejected, Pending).

---

## 🏗️ Architecture: T1xx Schema

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
| `t901_access_requests` | **Requests**: Stores user requests for role elevation (linked to `t101` roles). | ✅ |
| `t107_login_history` | **Audit Log**: Tracks login events, IP addresses, and user agent strings. | 🚧 (Planned) |

### 🔐 Authentication Flow
1.  **Google OAuth / Mock Auth**: Users sign in.
2.  **Auto-Registration**: A Supabase Trigger (`handle_new_user`) automatically creates a `t106_user_profile` entry with the default role `USER`.
3.  **Role Guard**: The frontend `useAuth` hook fetches the user's `primary_role` from `t106`.
4.  **Dashboard**: Tiles are dynamically filtered based on `t104` permissions for that role.

### 🎨 Frontend Structure
*   **Tech Stack**: Vite, React, TypeScript, Tailwind CSS, Shadcn UI, Supabase Client.
*   **Key Components**:
    *   `Dashboard.tsx`: Generates the UI based on role permissions.
    *   `useAuth.tsx`: Centralized auth state management (currently handles both Mock and Real auth logic).
    *   `RequestAccess.tsx`: Form for role elevation.
    *   `RequestHistory.tsx`: View for tracking request status.

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

### Running Locally
```bash
npm run dev
```

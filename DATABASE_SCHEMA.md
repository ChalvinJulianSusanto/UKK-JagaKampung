# JagaKampung Database Schema Documentation

This document provides a comprehensive overview of the database schema for the JagaKampung application. It reflects the structure defined in the Mongoose models located in `backend/models/`.

## Entity Relationship Diagram (ERD)

The following diagram visualizes the relationships between the entities in the system.

```mermaid
erDiagram
    %% Relationships
    USER ||--o{ ATTENDANCE : "has assignments"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ SCHEDULE : "creates (admin)"
    USER ||--o{ ATTENDANCE_RECAP : "creates (admin)"
    USER ||--o{ ATTENDANCE : "approves (admin)"

    USER ||--o{ BUDGET : "creates (admin)"

    SCHEDULE ||--|{ SCHEDULE_ENTRY : "embeds entries"
    SCHEDULE ||--o{ ATTENDANCE : "linked to"

    %% Entity Definitions

    USER {
        ObjectId _id PK
        String name "Required"
        String email "Unique, Required"
        String password "Hashed, Optional (Google)"
        String phone
        String rt "Enum: 01-06"
        String role "Enum: user, admin"
        String status "Enum: active, banned"
        String photo "URL"
        String googleId "OAuth ID"
        String authProvider "local, google"
        Date createdAt
        Date updatedAt
    }

    SCHEDULE {
        ObjectId _id PK
        String rt "Enum: 01-06"
        Number month "1-12"
        Number year "YYYY"
        ObjectId createdBy FK "User"
        Date createdAt
        Date updatedAt
    }

    SCHEDULE_ENTRY {
        ObjectId _id PK "Sub-document ID"
        String guardName
        Number date "1-31"
        String day "Senin-Minggu"
        String phone
        String notes
        String email
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId user FK "User"
        ObjectId schedule FK "Schedule"
        String rt "Enum: 01-06"
        Date date
        String status "hadir, izin"
        String type "masuk, pulang, izin"
        String photo "URL"
        String photoPublicId "Cloudinary ID"
        String reason "For izin"
        Boolean approved
        ObjectId approvedBy FK "User"
        Date approvedAt
        Object location "lat, long"
        Date createdAt
        Date updatedAt
    }

    ATTENDANCE_RECAP {
        ObjectId _id PK
        String rt "Enum: 01-06"
        Date date
        String time "HH:MM"
        Array guards "String[] names"
        String photo "URL"
        ObjectId createdBy FK "User"
        Date createdAt
        Date updatedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId user FK "User"
        String type "success, info, warning, error"
        String title
        String message
        Boolean read "Default: false"
        String link "Optional URL"
        Object metadata "Mixed"
        Date createdAt
        Date updatedAt
    }

    INCOME {
        ObjectId _id PK
        String category "Custom String"
        Number amount
        Date date
        String description
        String rt "Enum: 01-06, RW-01"
        Number year
        String month
        Date createdAt
        Date updatedAt
    }

    BUDGET {
        ObjectId _id PK
        Number year
        String rt "Enum: 01-06, RW-01"
        String category "Custom String"
        Number allocatedAmount
        Number spentAmount
        String description
        ObjectId createdBy FK "User"
        Date createdAt
        Date updatedAt
    }
```

## Data Dictionary

### 1. User (`User.js`)
Represents all users in the system, including Security Guards and Administrators.
- **Authentication**: Supports both generic email/password and Google OAuth.
- **Role Management**: Distinguished by the `role` field ('user' or 'admin').
- **RT Association**: Users are assigned to a specific RT (Rukun Tetangga).

### 2. Schedule (`Schedule.js`)
Represents the monthly guard roster for a specific RT.
- **Composite Key**: Unique combination of `rt`, `month`, and `year`.
- **Entries**: Daily assignments are stored in the `entries` array (embedded documents), not as separate collections. This optimizes read performance for fetching a full month's schedule.

### 3. Attendance (`Attendance.js`)
Records specific attendance events.
- **Event Types**:
    - `masuk`: Clock-in
    - `pulang`: Clock-out
    - `izin`: Leave request
- **Validation**: Links to the `User` and the `Schedule` to validate against the roster.
- **Geolocation**: Stores `latitude` and `longitude` in the `location` field.

### 4. AttendanceRecap (`AttendanceRecap.js`)
A daily summary report usually created by a supervisor or admin.
- **Purpose**: Provides a snapshot of who was on duty and a photo proof for the shift.
- **Data Structure**: Stores guard names as a simple array of strings, snapshotting the roster at that time.

### 5. Notification (`Notification.js`)
System-wide notifications for users.
- **Features**: Supports read status tracking and deep linking (`link` field).

### 6. Income (`Income.js`)
Records financial income for the RW.
- **Category**: Flexible string field (no longer restricted to enum).
- **Scope**: Can be specific to an RT or general (RW).

### 7. Budget (`Budget.js`)
Records budget allocations and usage.
- **Category**: Flexible string field (no longer restricted to enum).
- **Tracking**: Tracks `allocatedAmount` vs `spentAmount`.
- **Virtuals**: Includes virtual fields for `remainingAmount` and `usagePercentage`.

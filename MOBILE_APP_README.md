# SmartFlowPro Mobile App - Technical Documentation

## For Web Admin Development Context

This document provides complete documentation of the SmartFlowPro mobile app architecture, user flows, and design system. Use this as a reference when building the Web Admin dashboard to ensure consistency and understand shared backend resources.

---

## 1. Project Overview

**App Name**: SmartFlowPro  
**Version**: 2.0.0  
**Platform**: iOS & Android (Flutter)  
**Target User**: Field Service Technicians  
**Backend**: Supabase (PostgreSQL + Edge Functions + Realtime)

### Purpose
SmartFlowPro is a **technician-only mobile application** for field service management. Technicians use this app to:
- View and manage assigned visits
- Start/pause/complete jobs
- Create quotes and invoices
- Capture signatures and photos
- Communicate via internal chat
- Access AI assistant for job support

> **IMPORTANT**: This mobile app is for **technicians only**. Admin/Dispatcher/Accountant roles use the **Web Admin Dashboard**.

---

## 2. Tech Stack

### Framework & Language
- **Flutter** 3.8+
- **Dart** SDK ^3.8.0

### State Management
- **Riverpod** 2.5.1 (Provider-based, reactive)
- `flutter_riverpod` for widgets
- `riverpod_annotation` + `riverpod_generator` for code gen

### Navigation
- **GoRouter** 13.2.0 (Declarative routing)
- Deep linking support
- Auth-based redirects

### Backend Integration
- **Supabase Flutter** 2.0.0
  - Authentication (JWT)
  - PostgreSQL (RLS-protected)
  - Realtime subscriptions
  - Storage (media, signatures)

### Local Storage
- **Hive** 2.2.3 (NoSQL, offline-first)
- **SharedPreferences** (simple key-value)
- **FlutterSecureStorage** (tokens, sensitive data)

### UI & Styling
- **flutter_screenutil** (responsive sizing)
- **google_fonts** (typography)
- **google_maps_flutter** (3D maps)
- **table_calendar** (schedule view)
- **shimmer** (loading states)

### Additional Features
- **pdf** + **printing** (invoice PDF generation)
- **firebase_messaging** (push notifications)
- **sentry_flutter** (error monitoring)
- **speech_to_text** (voice input)
- **signature** (signature capture)

---

## 3. Project Architecture

### Directory Structure

```
lib/
├── main.dart                    # App entry point
├── app/
│   └── export/exports.dart      # Barrel exports
├── core/
│   ├── constants/               # App constants
│   ├── services/                # Core services
│   │   ├── offline_queue_service.dart
│   │   ├── push_notification_service.dart
│   │   ├── rate_limiter_service.dart
│   │   └── sync_optimization_service.dart
│   ├── splash/                  # Splash screen
│   └── theme/
│       ├── app_colors.dart      # Color palette
│       └── app_text_styles.dart # Typography
├── features/                    # Feature modules (179 files)
│   ├── ai_assistant/            # AI chat assistant
│   ├── audit/                   # Audit logging
│   ├── auth/                    # Authentication
│   ├── billing/                 # Billing settings
│   ├── chat/                    # Internal messaging
│   ├── inventory/               # Inventory management
│   ├── invoices/                # Invoice management
│   ├── organization/            # Org data
│   ├── quotes/                  # Quote builder
│   ├── settings/                # App settings
│   ├── team/                    # Team data
│   └── visits/                  # Visit management (core)
├── router/
│   └── app_router.dart          # GoRouter config
└── shared/
    ├── navigation/              # Bottom nav
    └── presentation/widgets/    # Shared widgets
```

### Feature Module Structure

Each feature follows clean architecture:

```
features/{feature}/
├── data/
│   ├── models/                  # Data models (Freezed)
│   ├── repositories/            # Data access layer
│   └── datasources/             # Remote/Local sources
├── domain/
│   └── services/                # Business logic
└── presentation/
    ├── providers/               # Riverpod providers
    ├── screens/                 # UI screens
    └── widgets/                 # Feature widgets
```

---

## 4. Design System

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Cream** | `#FFFDF6` | Background |
| **Beige** | `#FAF6E9` | Secondary background |
| **Dark Grey** | `#494949` | Primary brand, text, buttons |
| **White** | `#FFFFFF` | Cards, surfaces |

#### Status Colors
| Status | Hex | Usage |
|--------|-----|-------|
| Success | `#10B981` | Completed |
| Warning | `#F59E0B` | Paused, pending |
| Error | `#EF4444` | Cancelled, errors |
| Info | `#0EA5E9` | In progress |
| Scheduled | `#6B7280` | Scheduled visits |

#### Visit Status Colors
```dart
scheduledColor: #6B7280  (Gray)
inProgressColor: #3B82F6 (Blue)
pausedColor: #F59E0B    (Orange)
completedColor: #10B981 (Green)
cancelledColor: #EF4444 (Red)
```

### Typography

- **Font Family**: Google Fonts (system default)
- **Heading**: Bold, Dark Grey
- **Body**: Regular, neutral gray
- **Small/Labels**: Light gray, smaller size

### Spacing

Using `flutter_screenutil` for responsive sizing:
- `.w` suffix for width-based sizing
- `.h` suffix for height-based sizing
- `.sp` suffix for font sizes

---

## 5. User Roles & Access

### Role Definitions (from PRD)

| Role | Mobile App | Web Admin |
|------|------------|-----------|
| **Technician** | ✅ Full Access | ❌ Blocked |
| **Admin** | ❌ Blocked | ✅ Full Access |
| **Dispatcher** | ❌ Blocked | ✅ Full Access |
| **Accountant** | ❌ Blocked | ✅ Full Access |

### Role Enum
```dart
enum UserRole {
  admin,
  dispatcher,
  accountant,
  technician,
}
```

---

## 6. Screen Map & Navigation

### Bottom Navigation Tabs

| Tab | Screen | Description |
|-----|--------|-------------|
| 1. Home | Map View | Today's visits on 3D map |
| 2. Schedule | Calendar | Weekly/monthly calendar |
| 3. Visits | List | All assigned visits |
| 4. Chat | Chat List | Internal messaging |
| 5. More | Settings | Profile, settings, logout |

### Route Paths

```dart
class AppRoutePaths {
  static const String splash = '/';
  static const String auth = '/auth';
  static const String mainNavigation = '/main';
  static const String home = '/main/home';
  static const String schedule = '/main/schedule';
  static const String jobDetails = '/job-details/:id';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String onMyWay = '/on-my-way';
  static const String createQuotes = '/create-quotes';
  static const String quotesList = '/quotes-list';
  static const String inventoryList = '/inventory';
  static const String addInventoryItem = '/inventory/add';
  static const String aiDetectInventory = '/inventory/ai-detect';
  static const String invoiceList = '/invoices';
  static const String chatList = '/chat';
  static const String chatThread = '/chat/:chatId';
  static const String aiAssistant = '/ai-assistant';
  static const String conflictResolution = '/conflicts';
}
```

---

## 7. Core User Journeys

### Journey 1: Complete a Visit

```
Login → Home (Map) → Tap Visit Pin → Visit Details
  → "Start Visit" → Status: In Progress
  → Add Notes (optional)
  → Take Photos (optional)
  → Create Quote
    → Add Line Items (Services, Materials, Discounts)
    → Toggle Tax
    → Finalize Quote
  → Create Invoice from Quote
    → Preview Invoice → Finalize
  → Capture Customer Signature
  → "Complete Visit" → Status: Completed
```

### Journey 2: Inventory Management

```
More Tab → Inventory → View Items List
  → "Add Item" → Manual Entry
    → Enter Name, Unit, SKU
    → Upload Photo → AI Price Suggestion
    → Save Item
  OR
  → "Add with AI" → Camera/Gallery
    → AI Auto-Detects: Name, Price, SKU
    → Confirm & Save
```

### Journey 3: Chat Communication

```
Chat Tab → Chat List → Direct Chats | Group Chats
  → Tap Chat → Chat Thread
  → Type Message → Send
  → Real-time message sync via WebSocket
```

### Journey 4: AI Assistant

```
From Visit Details → "AI Assist" Button
  → Context: Current visit info loaded
  → Type question or upload image
  → AI responds with suggestions
  → All interactions logged
```

---

## 8. Data Models (Key Entities)

### Visit Model
```dart
class VisitModel {
  String id;
  String orgId;
  String jobId;
  String technicianId;
  DateTime scheduledStart;
  DateTime scheduledEnd;
  DateTime? actualStart;
  DateTime? actualEnd;
  VisitStatus status; // scheduled, in_progress, paused, completed, cancelled
  String? customerName;
  String? address;
  double? latitude;
  double? longitude;
}
```

### Quote Model
```dart
class QuoteModel {
  String id;
  String orgId;
  String visitId;
  String quoteNumber; // Format: QT-{org_prefix}-{0001}
  QuoteStatus status; // draft, finalized, invoiced
  bool taxable;
  double subtotal;
  double discountTotal;
  double taxTotal;
  double grandTotal;
  List<LineItemModel> lineItems;
}
```

### Invoice Model
```dart
class InvoiceModel {
  String id;
  String orgId;
  String visitId;
  String? quoteId;
  String invoiceNumber; // Format: INV-{org_prefix}-{0001}
  InvoiceStatus status; // draft, unpaid, partially_paid, paid, void, refunded
  double total;
}
```

### User Model
```dart
class UserModel {
  String id;
  String orgId;
  String fullName;
  String email;
  String? phone;
  UserRole role;
  UserStatus status; // active, suspended, deactivated
}
```

---

## 9. State Management Patterns

### Provider Structure

```dart
// Auth state
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {...});

// Current user
final currentUserProvider = Provider<UserModel?>((ref) {...});

// Visits
final todayVisitsProvider = FutureProvider<List<VisitModel>>((ref) {...});
final visitDetailsProvider = FutureProvider.family<VisitModel, String>((ref, id) {...});

// Quotes
final visitQuotesProvider = FutureProvider.family<List<QuoteModel>, String>((ref, visitId) {...});

// Chat (Realtime)
final chatMessagesProvider = StreamProvider.family<List<ChatMessage>, String>((ref, chatId) {...});
```

### Offline Queue

```dart
class OfflineQueueService {
  // Queue mutations when offline
  Future<void> enqueue(QueuedOperation operation);
  
  // Process queue when online
  Future<void> processQueue();
  
  // Priority order: state changes → notes → materials → signature → media
}
```

---

## 10. Backend Integration

### Supabase Configuration

```dart
// Environment variables
SUPABASE_URL=https://pbqbsdmwbjpsvxuuwjiv.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

// Initialization (main.dart)
await Supabase.initialize(
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
);
```

### Database Tables (23 Total)

| Table | Description |
|-------|-------------|
| organizations | Company data |
| users | All users (all roles) |
| customers | Customer records |
| properties | Customer properties |
| jobs | Work orders |
| visits | Scheduled visits |
| notes | Visit notes |
| quotes | Quote documents |
| line_items | Quote line items |
| invoices | Invoices |
| payments | Payment records |
| inventory_items | Parts/materials |
| billing_settings | Tax rates, fees |
| chat_threads | Chat conversations |
| chat_participants | Chat members |
| chat_messages | Messages |
| visit_media | Photos/videos |
| visit_signatures | Customer signatures |
| audit_logs | Action history |
| ai_interaction_logs | AI conversation logs |
| employee_invitations | Pending invites |
| sequence_counters | Number generation |
| quote_approvals | Optional approvals |

### Realtime Channels

```dart
// Visit updates
supabase.channel('visits:${orgId}').on(...)

// Chat messages
supabase.channel('chat:${chatId}').on(...)

// Quote changes
supabase.channel('quotes:${visitId}').on(...)
```

---

## 11. Offline Support

### Cached Data
- Today's visits + next 7 days
- Visit details and notes
- Inventory items
- User profile

### Queued Operations (When Offline)
- Start/pause visit ✅
- Add notes ✅
- Capture photos ✅
- Capture signature ✅

### Requires Online
- Finalize quote ❌
- Finalize invoice ❌
- Send chat messages ❌

---

## 12. Key Features Summary

| Feature | Status | Module |
|---------|--------|--------|
| Authentication | ✅ | `features/auth` |
| Visit Management | ✅ | `features/visits` |
| Quote Builder | ✅ | `features/quotes` |
| Invoice Generation | ✅ | `features/invoices` |
| Signature Capture | ✅ | `features/visits` |
| Photo/Media Upload | ✅ | `features/visits` |
| Inventory CRUD | ✅ | `features/inventory` |
| AI Item Detection | ✅ | `features/inventory` |
| Internal Chat | ✅ | `features/chat` |
| AI Assistant | ✅ | `features/ai_assistant` |
| Push Notifications | ✅ | `core/services` |
| 3D Map | ✅ | `features/visits` |
| Offline Queue | ✅ | `core/services` |
| PDF Invoices | ✅ | `features/invoices` |

---

## 13. For Web Admin Development

### Shared Resources

The Web Admin will share:
1. **Same Supabase backend** - Same database, auth, storage
2. **Same RLS policies** - Extended for web_admin channel
3. **Same data models** - TypeScript equivalents
4. **Same color palette** - Use identical hex codes
5. **Same status definitions** - Visit, Quote, Invoice statuses

### Key Differences

| Aspect | Mobile App | Web Admin |
|--------|------------|-----------|
| Users | Technicians only | Admin/Dispatcher/Accountant |
| Framework | Flutter | Next.js + React |
| Functions | View/Create | Full CRUD + Reports |
| Payments | Preview only | Record payments |
| Team | View only | Invite/Manage |
| Settings | Personal prefs | Org-wide config |

### API Channel Validation

All API calls include channel validation:
- Mobile app sends: `channel: 'mobile_technician'`
- Web admin sends: `channel: 'web_admin'`
- Backend validates role + channel match

---

## 14. Quick Reference

### Build Commands

```bash
# Development
flutter run

# iOS Simulator
flutter build ios --simulator

# Production iOS
flutter build ios --release

# Production Android
flutter build apk --release

# Generate Riverpod code
flutter pub run build_runner build
```

### Environment Variables

```bash
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbGci...
ENVIRONMENT=production|development
USE_MOCK_DATA=false
```

### Important Files

| File | Purpose |
|------|---------|
| `lib/main.dart` | App entry, Supabase init |
| `lib/router/app_router.dart` | All routes |
| `lib/core/theme/app_colors.dart` | Color palette |
| `lib/core/services/offline_queue_service.dart` | Offline sync |
| `lib/features/auth/presentation/providers/auth_provider.dart` | Auth state |

---

## Document Version

- **Last Updated**: January 2026
- **App Version**: 2.0.0
- **Author**: SmartFlowPro Development Team

---

*This document is intended for Web Admin developers. For mobile app development, refer to the inline code documentation and PRD.*

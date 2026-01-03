# Studify - Backend Development Prompt

## Project Overview

**Studify** is a comprehensive educational e-commerce platform that combines course delivery with physical product sales (retail and wholesale). The application serves multiple user types:
1. **Students** - Course buyers and learners
2. **Doctors/Instructors** - Course creators and educators
3. **Delivery Personnel** - Handles physical delivery of course materials and products
4. **Administrators** - Platform managers with role-based permissions
5. **Wholesale Customers** - Bulk product buyers

**Key Features:**
- Educational courses with learning management
- Product catalog (retail and wholesale pricing)
- Excel import/export for products
- Comprehensive reporting system
- Role-based access control (RBAC) with granular permissions
- Separate user management for Students, Doctors, and other roles

---

## Application Flows Analysis

Based on the Figma design, the application consists of three main user flows:

---

## Complete Screen Inventory (Screen-by-Screen Breakdown)

### 1. Student Flow

#### A. Splash & Onboarding Screens

1. **Splash Screen 1**
   - Teal gradient background
   - Blank/loading state

2. **Splash Screen 2**
   - "STUDIFY" logo/branding in white text
   - Small yellow dot indicator
   - Teal background

3. **Onboarding Screen 1 - Finding Study Materials**
   - Illustration: Person holding a document with a magnifying glass
   - Descriptive text about finding study materials
   - "Next" button at bottom
   - Pagination dots (3 dots, first highlighted)

4. **Onboarding Screen 2 - Learning/Courses**
   - Illustration: Person with laptop and books
   - Descriptive text about learning or courses
   - "Next" button at bottom
   - Pagination dots (3 dots, second highlighted)

5. **Onboarding Screen 3 - Achievement/Certification**
   - Illustration: Person with graduation cap and certificate
   - Descriptive text about achieving goals or certification
   - "Get Started" or "Next" button at bottom
   - Pagination dots (3 dots, third highlighted)

#### B. Authentication & Registration Screens

6. **Login Screen**
   - Email input field
   - Password input field
   - "Forgot Password?" link/button
   - "Login" button (primary action)
   - "Don't have an account? Sign Up" link
   - Social login options (if applicable)

7. **Sign Up Screen**
   - Name input field
   - Email input field
   - Phone Number input field
   - Password input field
   - Confirm Password input field
   - "Sign Up" button (primary action)
   - "Already have an account? Login" link
   - Terms & Conditions checkbox (if applicable)

8. **OTP Verification Screen**
   - 4-digit OTP input fields (separate boxes for each digit)
   - "Resend OTP" link/button
   - "Verify" button (primary action)
   - Timer showing countdown for resend
   - Instructions text

9. **Password Reset Request Screen**
   - Email input field
   - "Send Reset Link" button
   - Back to login link

10. **Password Reset Screen**
    - New Password input field
    - Confirm New Password input field
    - Password strength indicator (if applicable)
    - "Reset Password" button (primary action)

11. **Profile Creation - Step 1 (Personal Info)**
    - Gender dropdown selector (Male, Female, Other)
    - Date of Birth date picker
    - Location text input (or location picker)
    - "Next" button (primary action)
    - Skip button (optional)

12. **Profile Creation - Step 2 (Profile Picture)**
    - Circular profile picture placeholder
    - "Upload Photo" button
    - "Take Photo" button (camera access)
    - "Finish" button (primary action)
    - Skip button (optional)

13. **Keyboard Layout Screens**
    - Numeric keyboard layout (for OTP entry)
    - Alphanumeric keyboard layout (for text inputs)
    - Special characters keyboard

#### C. Home & Course Discovery Screens

14. **Home Dashboard/Main Screen**
    - **Top Bar**:
      - Location display (current city/area)
      - Search icon button
      - Notification icon button (with badge count if unread)
    - **Banner/Carousel Section**:
      - Featured course/offer banners
      - Swipeable carousel with indicators
    - **Categories Section**:
      - Horizontal scrollable category cards
      - Categories: Design, Development, Marketing, Business, etc.
      - Each card shows category icon and name
    - **Popular Courses Section**:
      - Section title: "Popular Courses"
      - Horizontal scrollable course cards
      - Each course card displays:
        - Course thumbnail/image
        - Course title
        - Instructor name
        - Star rating
        - Price
        - Number of students/reviews (optional)
    - **Additional Sections** (if applicable):
      - "New Courses" section
      - "Recommended for You" section
    - **Bottom Navigation Bar**:
      - Home icon (active)
      - Search icon
      - Cart icon (with badge count if items in cart)
      - Profile icon

15. **Search Screen**
    - Search bar at top (with focus state)
    - Cancel/Search button
    - **Recent Searches Section**:
      - List of recent search queries
      - Clear/Delete option for each
      - "Clear All" button
    - **Popular Searches Section**:
      - List of popular search terms
      - Each as tappable item
    - **Search Results** (after search):
      - List of matching courses
      - Filter options (category, price range, rating)
      - Sort options (relevance, price, rating, newest)

16. **Course Listing by Category Screen**
    - Category name as header
    - Filter and sort options
    - Grid or list view toggle (optional)
    - Course cards similar to home screen
    - Pagination or infinite scroll
    - Back button

17. **Course Details Screen**
    - **Hero Section**:
      - Large course image/video preview (full width)
      - Play button overlay (if video)
    - **Course Info Section**:
      - Course title
      - Instructor name (tappable)
      - Star rating display
      - Number of reviews
      - Price (original and discounted if applicable)
    - **Action Buttons**:
      - "Add to Cart" button (secondary)
      - "Buy Now" button (primary)
    - **Course Description**:
      - Expandable/collapsible text
      - Full description content
    - **"What you'll learn" Section**:
      - List of learning outcomes/benefits
      - Checkmark icons for each point
    - **Course Content Section**:
      - List of modules/lessons
      - Expandable sections for each module
      - Lesson titles and durations
      - Lock icons for locked content
    - **Instructor Section**:
      - Instructor profile picture
      - Instructor name
      - Bio/description
      - "View Profile" button
    - **Reviews Section**:
      - Average rating display
      - Rating distribution chart
      - "See All Reviews" button
      - Preview of top reviews

18. **Instructor Profile Screen**
    - Instructor profile picture (large, circular)
    - Instructor name
    - Rating display (average rating)
    - Bio/description text
    - "Courses Taught" section:
      - List of courses by this instructor
      - Course cards with thumbnails, titles, ratings, prices
    - Follow/Message buttons (if applicable)
    - Back button

19. **Course Reviews Screen (Full List)**
    - Screen title: "Reviews"
    - Average rating summary
    - Rating filter options (All, 5 stars, 4 stars, etc.)
    - Sort options (Most recent, Highest rated, etc.)
    - List of reviews, each showing:
      - User profile picture
      - User name
      - Star rating
      - Review date
      - Review comment/text
      - Helpful button (if applicable)
    - Pagination
    - Back button

20. **Write Review Screen** (if accessible from course details)
    - Star rating selector (1-5 stars)
    - Review text input (multiline)
    - Character counter
    - "Submit Review" button
    - Cancel button

#### D. Shopping & Checkout Screens

21. **Cart Screen**
    - Screen title: "Shopping Cart"
    - **Cart Items List**:
      - Each item shows:
        - Course thumbnail/image
        - Course title
        - Instructor name
        - Price
        - Quantity selector (if applicable, usually 1 for courses)
        - Remove/Delete button/icon
    - **Order Summary Section**:
      - Subtotal amount
      - Tax/VAT (if applicable)
      - Delivery fee (if applicable)
      - Total amount (bold, larger text)
    - **Action Buttons**:
      - "Continue Shopping" link (optional)
      - "Checkout" button (primary, full width)
    - Empty cart state (if no items):
      - Empty cart illustration
      - "Your cart is empty" message
      - "Browse Courses" button

22. **Checkout - Delivery Address Screen**
    - Screen title: "Select Delivery Address"
    - **Existing Addresses List**:
      - Radio buttons for selection
      - Each address card shows:
        - Name/Title
        - Full address (street, city, state, zip)
        - Default badge (if default address)
        - Edit button
        - Delete button
    - **Add New Address Button**:
      - Opens address form
    - **Address Form Fields** (when adding/editing):
      - Address label/name (Home, Work, etc.)
      - Street address
      - City
      - State/Province
      - Zip/Postal code
      - Country
      - Set as default checkbox
      - Save button
      - Cancel button
    - "Continue" button (primary action)

23. **Checkout - Payment Method Screen**
    - Screen title: "Select Payment Method"
    - **Payment Options** (radio buttons):
      - Credit/Debit Card
        - Card icon
        - Input fields for card details (when selected):
          - Card number
          - Cardholder name
          - Expiry date
          - CVV
          - Billing address (optional)
      - PayPal
        - PayPal logo/icon
        - Redirect to PayPal login (when selected)
      - Cash on Delivery
        - Cash icon
        - Message about COD availability
    - Selected payment method highlighted
    - "Continue" button (primary action)
    - Back button

24. **Checkout - Order Summary Screen**
    - Screen title: "Order Summary"
    - **Order Items Review**:
      - List of courses in order
      - Each shows thumbnail, title, price
      - Total items count
    - **Delivery Address**:
      - Selected address displayed
      - "Change" button
    - **Payment Method**:
      - Selected payment method displayed
      - "Change" button
    - **Price Breakdown**:
      - Subtotal
      - Tax/VAT
      - Delivery fee
      - **Total Amount** (bold, highlighted)
    - Terms & Conditions checkbox
    - "Place Order" button (primary, full width)
    - Back button

25. **Order Confirmation Screen**
    - Success checkmark icon (green)
    - Success message: "Order Placed Successfully!"
    - Order ID/Number display (highlighted)
    - Order details summary
    - **Action Buttons**:
      - "Track Order" button (primary)
      - "Continue Shopping" button (secondary)
      - "View Orders" button (optional)

26. **Payment Success Modal**
    - Small pop-up/modal overlay
    - Success checkmark icon
    - "Payment Successful" message
    - Transaction ID (if applicable)
    - "OK" or "Continue" button

27. **Payment Failure Modal**
    - Small pop-up/modal overlay
    - Error/X icon (red)
    - "Payment Failed" message
    - Error reason/description
    - "Try Again" button
    - "Cancel" button

#### E. Profile & Settings Screens

28. **User Profile Screen**
    - Profile picture (circular, large)
    - User name
    - Email address
    - Edit profile button/icon
    - **Menu Options List**:
      - My Courses (with count badge if applicable)
      - My Orders (with count badge if applicable)
      - Settings
      - Notifications (with unread count badge)
      - Help & Support
      - Privacy Policy
      - Terms & Conditions
      - About Us (optional)
      - Logout (red/destructive color, at bottom)

29. **My Courses Screen**
    - Screen title: "My Courses"
    - Filter options (All, In Progress, Completed)
    - **Enrolled Courses List**:
      - Course cards showing:
        - Course thumbnail
        - Course title
        - Instructor name
        - Progress bar/percentage
        - "Continue Learning" button
        - Completion badge (if completed)
    - Empty state (if no enrollments):
      - Illustration
      - "You haven't enrolled in any courses yet"
      - "Browse Courses" button
    - Search/filter functionality

30. **Course Learning Screen** (when accessing enrolled course)
    - Course header with title
    - Video player (if video lesson)
    - Lesson content (if text-based)
    - Lesson navigation (Previous/Next buttons)
    - Lesson list sidebar/drawer
    - Progress indicator
    - Notes/Bookmarks section (optional)
    - Discussion/Q&A section (optional)

31. **My Orders Screen**
    - Screen title: "My Orders"
    - Filter options (All, Pending, Processing, Delivered, Cancelled)
    - **Orders List**:
      - Order cards showing:
        - Order number/ID
        - Order date
        - Course thumbnail(s)
        - Course title(s)
        - Order status badge
        - Total amount
        - "Track Order" button (if applicable)
        - "View Details" button
    - Empty state (if no orders):
      - Illustration
      - "You haven't placed any orders yet"
      - "Browse Courses" button

32. **Order Details Screen** (from My Orders)
    - Order number/ID (header)
    - Order date and time
    - Order status with timeline/progress
    - **Order Items**:
      - List of courses in order
      - Each shows thumbnail, title, price
    - **Delivery Information**:
      - Delivery address
      - Expected delivery date (if applicable)
    - **Payment Information**:
      - Payment method
      - Payment status
      - Transaction ID (if applicable)
    - **Price Breakdown**:
      - Subtotal, tax, delivery fee, total
    - Action buttons:
      - "Track Order" (if in transit)
      - "Cancel Order" (if cancellable)
      - "Download Invoice" (if available)

33. **Order Tracking Screen**
    - Order number
    - Delivery status timeline/steps:
      - Order Placed (completed)
      - Processing (completed/pending)
      - Shipped (completed/pending)
      - Out for Delivery (completed/pending)
      - Delivered (completed/pending)
    - Map view showing delivery location (if available)
    - Delivery person details (if assigned)
    - Estimated delivery time

34. **Settings Screen**
    - Screen title: "Settings"
    - **Account Settings**:
      - Edit Profile option
      - Change Password option
      - Email preferences
    - **Notification Settings**:
      - Push notifications toggle
      - Email notifications toggle
      - SMS notifications toggle
      - Notification types (orders, courses, promotions)
    - **Language Settings**:
      - Language selector dropdown
    - **App Settings**:
      - Theme (Light/Dark) - if applicable
      - Data usage settings
    - **Privacy & Security**:
      - Privacy settings
      - Two-factor authentication toggle
    - "Logout" button (at bottom)

35. **Edit Profile Screen**
    - Profile picture (with change option)
    - Name input field
    - Email input field (may be disabled if verified)
    - Phone number input field
    - Gender dropdown
    - Date of birth picker
    - Location input
    - "Save Changes" button
    - Cancel button

36. **Change Password Screen**
    - Current password input
    - New password input
    - Confirm new password input
    - Password strength indicator
    - "Update Password" button
    - Cancel button

37. **Notifications Screen**
    - Screen title: "Notifications"
    - Filter options (All, Unread)
    - "Mark All as Read" button
    - **Notifications List**:
      - Each notification shows:
        - Icon (type-specific)
        - Title
        - Message/preview
        - Timestamp
        - Unread indicator (dot)
        - Swipe to delete (optional)
    - Empty state (if no notifications):
      - Illustration
      - "No notifications yet"
    - Tap to mark as read/view details

38. **Help & Support Screen**
    - Screen title: "Help & Support"
    - **FAQ Section**:
      - Expandable FAQ items
      - Common questions and answers
    - **Contact Options**:
      - Email support button
      - Phone support button
      - Live chat button (if available)
      - Contact form
    - **Resources**:
      - User guide/tutorial links
      - Video tutorials
      - Community forum link (if available)

39. **Privacy Policy Screen**
    - Screen title: "Privacy Policy"
    - Scrollable content
    - Formatted text with sections
    - Last updated date
    - Back button

40. **Terms & Conditions Screen**
    - Screen title: "Terms & Conditions"
    - Scrollable content
    - Formatted text with sections
    - Last updated date
    - Accept/Agree button (if required)
    - Back button

---

---

### 2. Delivery Flow

#### A. Splash & Authentication Screens

41. **Splash Screens** (Same as Student Flow)
    - Teal gradient splash screen
    - STUDIFY branded splash screen

42. **Delivery Login Screen**
    - Email/Phone input field
    - Password input field
    - "Forgot Password?" link
    - "Login" button
    - "Don't have an account? Sign Up" link
    - Role indicator (Delivery)

43. **Delivery Sign Up Screen**
    - Name input field
    - Email input field
    - Phone Number input field (required for delivery)
    - Password input field
    - Confirm Password input field
    - Terms & Conditions checkbox
    - "Sign Up" button

44. **Delivery OTP Verification Screen**
    - 4-digit OTP input (phone verification)
    - "Resend OTP" button
    - "Verify" button
    - Timer countdown

45. **Delivery Profile Creation - Step 1 (Vehicle & License)**
    - Vehicle type selector (Car, Motorcycle, Bicycle, Van, etc.)
    - License number input
    - License expiry date picker
    - "Next" button

46. **Delivery Profile Creation - Step 2 (Documents)**
    - **Document Upload Sections**:
      - National ID/Document upload
        - Upload button
        - Preview of uploaded document
        - "Upload" or "Change" button
      - Driver's License upload
        - Upload button
        - Preview of uploaded document
        - "Upload" or "Change" button
      - Vehicle Registration upload
        - Upload button
        - Preview of uploaded document
        - "Upload" or "Change" button
    - "Next" button

47. **Delivery Profile Creation - Step 3 (Bank Details)**
    - Bank name input/dropdown
    - Bank account number input
    - Account holder name input
    - Branch name (optional)
    - IBAN (if applicable)
    - "Complete Registration" button
    - Note about payout schedule

48. **Delivery Profile Creation - Step 4 (Profile Picture)**
    - Profile picture upload/take photo
    - "Finish" button

#### B. Order Management Screens

49. **Delivery Home/Dashboard Screen**
    - Status indicator (Available/Offline toggle)
    - Today's earnings summary card
    - Active deliveries count
    - "New Orders" section
    - "Active Deliveries" section
    - Bottom navigation (Home, Orders, Earnings, Profile)

50. **New Order Notification Screen**
    - **Order Alert Card**:
      - Order ID/Number (highlighted)
      - Pickup location (address)
      - Delivery location (address)
      - Distance/estimated time
      - Estimated earnings (highlighted, prominent)
      - Items count
    - **Action Buttons**:
      - "Accept" button (primary, green)
      - "Reject" button (secondary, red)
    - Auto-decline timer (if applicable)
    - Map preview (small)

51. **New Orders List Screen**
    - Screen title: "Available Orders"
    - Filter options (Distance, Earnings, Time)
    - **Orders List**:
      - Each order card shows:
        - Order ID
        - Pickup and delivery locations
        - Distance
        - Estimated earnings
        - Time since order placed
        - "Accept" button
    - Pull to refresh
    - Empty state (no available orders)

52. **Accepted Order Details Screen**
    - Order number header
    - Order status timeline
    - **Pickup Information**:
      - Pickup address
      - Contact person name
      - Contact phone number
      - "Call" button
      - "Navigate" button (opens maps)
    - **Delivery Information**:
      - Delivery address
      - Customer name
      - Customer phone number
      - "Call" button
    - **Order Items**:
      - List of items/courses
    - **Map View**:
      - Interactive map showing:
        - Current location
        - Pickup location (marker)
        - Delivery location (marker)
        - Route preview
    - **Actions**:
      - "Navigate to Pickup" button
      - "Picked Up" button (appears after navigation)

53. **In-Progress Delivery Screen**
    - Map view (full screen or large)
    - **Route Display**:
      - Current location marker
      - Destination marker
      - Route line/polyline
      - Distance remaining
      - Estimated time remaining
    - **Delivery Information Panel**:
      - Customer name
      - Delivery address
      - Phone number
      - "Call Customer" button
      - "Navigate" button
    - **Status Actions**:
      - "Delivered" button (primary, full width)
      - "Issue" or "Help" button (if problems)

54. **Picked Up Confirmation Screen**
    - Confirmation message: "Order Picked Up Successfully"
    - Order details
    - "Navigate to Delivery" button
    - Back to orders list

#### C. Order Completion Screens

55. **Delivery Complete Screen**
    - Success checkmark icon
    - "Delivery Completed!" message
    - Order ID
    - **Earnings Display**:
      - Amount earned for this delivery
      - Total earnings for today
    - **Rate Customer Section**:
      - Star rating selector (1-5 stars)
      - Optional comment field
      - "Submit" button
      - "Skip" button
    - "Go to Home" button
    - "View Earnings" button

56. **Order Rejected Confirmation**
    - Confirmation that order was rejected
    - Return to available orders

#### D. Delivery Profile Screens

57. **Delivery Person Profile Screen**
    - Profile picture
    - Name
    - Rating display (average)
    - Total deliveries count
    - Status toggle (Available/Offline)
    - **Menu Options**:
      - Earnings
      - Order History
      - Settings
      - Help & Support
      - Logout

58. **Earnings Screen**
    - Screen title: "Earnings"
    - **Time Period Selector**:
      - Today, This Week, This Month, All Time tabs/buttons
    - **Summary Cards**:
      - Total earnings (large, highlighted)
      - Number of deliveries
      - Average per delivery
    - **Earnings Breakdown**:
      - Daily breakdown (if weekly/monthly view)
      - List of individual delivery earnings:
        - Date
        - Order ID
        - Amount earned
        - Status (Paid/Pending)
    - **Payout Information**:
      - Next payout date
      - Pending amount
      - Payout history link
    - Chart/graph visualization (optional)

59. **Payout History Screen**
    - Screen title: "Payout History"
    - **Payouts List**:
      - Each payout shows:
        - Payout date
        - Amount
        - Status (Completed, Pending, Processing)
        - Transaction ID/reference
        - Period covered
    - Filter by status
    - Empty state if no payouts

60. **Delivery Order History Screen**
    - Screen title: "Order History"
    - Filter options (All, Completed, Cancelled)
    - **Past Deliveries List**:
      - Each order shows:
        - Order ID
        - Date and time
        - Pickup and delivery locations
        - Earnings amount
        - Status
        - "View Details" button
    - Search functionality
    - Pull to refresh

61. **Delivery Settings Screen**
    - Edit Profile option
    - Change Password option
    - Bank Account Details (edit)
    - Documents Management (re-upload/update)
    - Notification settings
    - Availability settings
    - Language settings
    - Help & Support
    - Privacy Policy
    - Terms & Conditions
    - Logout

---

---

### 3. Admin Flow

#### A. Authentication Screens

62. **Admin Login Screen**
    - Email input field
    - Password input field
    - "Forgot Password?" link
    - "Login" button
    - Admin branding/logo
    - Security note/2FA option (if applicable)

#### B. Dashboard & Management Screens

63. **Admin Dashboard Screen**
    - Screen title: "Dashboard"
    - **Key Metrics Cards** (4 main cards):
      - Total Users (with trend indicator)
      - Total Courses (with trend indicator)
      - Total Orders (with trend indicator)
      - Total Revenue (with trend indicator)
    - **Charts/Visualizations**:
      - Revenue chart (line or bar chart)
      - User growth chart
      - Orders over time chart
      - Category-wise course distribution (pie chart)
    - **Recent Activity Feed**:
      - List of recent actions (new users, new orders, etc.)
    - **Quick Actions**:
      - Links to key management sections
    - Sidebar navigation or bottom tabs:
      - Dashboard (active)
      - Users
      - Courses
      - Orders
      - Delivery
      - Analytics
      - Settings

64. **User Management - List Screen**
    - Screen title: "User Management"
    - **Search and Filters**:
      - Search bar
      - Filter by role (Student, Delivery, Admin, Instructor)
      - Filter by status (Active, Blocked)
      - Sort options
    - **Actions**:
      - "Add New User" button (if applicable)
      - Export data button
    - **Users Table/List**:
      - Columns: Name, Email, Role, Status, Joined Date, Actions
      - Each row shows:
        - Profile picture
        - Name
        - Email
        - Role badge
        - Status badge (Active/Blocked)
        - Join date
        - Actions dropdown:
          - View Details
          - Edit
          - Block/Unblock
          - Delete (if applicable)
    - Pagination

65. **User Details Screen** (Admin view)
    - User profile picture
    - User name
    - Email and phone
    - Role
    - Account status
    - Registration date
    - Last login
    - **Statistics**:
      - Total orders
      - Total spent
      - Enrolled courses count
    - **Actions**:
      - Edit User button
      - Block/Unblock button
      - Reset Password button
      - Delete User button (if applicable)
    - Back button

66. **Edit User Screen** (Admin)
    - Form with user details
    - Role selector (if admin can change roles)
    - Status toggle (Active/Blocked)
    - Save and Cancel buttons

67. **Course Management - List Screen**
    - Screen title: "Course Management"
    - **Search and Filters**:
      - Search bar
      - Filter by status (All, Published, Pending, Draft, Rejected)
      - Filter by category
      - Filter by instructor
      - Sort options
    - **Actions**:
      - "Add New Course" button
      - Bulk actions (Approve, Reject, Delete)
    - **Courses Table/List**:
      - Columns: Course, Instructor, Category, Status, Students, Revenue, Actions
      - Each row shows:
        - Course thumbnail
        - Course title
        - Instructor name
        - Category
        - Status badge
        - Students count
        - Revenue
        - Actions dropdown:
          - View Details
          - Edit
          - Approve/Reject
          - Publish/Unpublish
          - Delete
    - Pagination

68. **Course Details Screen** (Admin view)
    - Course thumbnail
    - Course title
    - Instructor name
    - Category
    - Status
    - Price
    - Rating and reviews count
    - Students enrolled
    - Revenue generated
    - Created date
    - Last updated
    - Full course description
    - Course content/modules list
    - Reviews preview
    - **Actions**:
      - Edit Course button
      - Approve/Reject button
      - Publish/Unpublish button
      - Delete button

69. **Add/Edit Course Screen** (Admin)
    - Course form fields:
      - Title
      - Description (rich text editor)
      - Category selector
      - Instructor selector
      - Price
      - Course image upload
      - Course video preview upload
      - Status selector
    - Course content/modules editor
    - Save and Cancel buttons

70. **Pending Courses Screen**
    - Screen title: "Pending Approval"
    - List of courses awaiting approval
    - Each course card shows:
      - Thumbnail
      - Title
      - Instructor
      - Submitted date
      - Preview button
      - Approve button
      - Reject button (with reason field)

71. **Order Management - List Screen**
    - Screen title: "Order Management"
    - **Search and Filters**:
      - Search by order ID or customer
      - Filter by status (All, Pending, Processing, Shipped, Delivered, Cancelled)
      - Filter by date range
      - Sort options
    - **Actions**:
      - Export orders button
    - **Orders Table/List**:
      - Columns: Order ID, Customer, Items, Amount, Status, Date, Actions
      - Each row shows:
        - Order ID/number
        - Customer name
        - Number of items
        - Total amount
        - Status badge
        - Order date
        - Actions dropdown:
          - View Details
          - Update Status
          - Assign Delivery
          - Cancel Order
    - Pagination

72. **Order Details Screen** (Admin view)
    - Order number header
    - Customer information
    - Order status with update option
    - Order items list
    - Delivery address
    - Payment information
    - Payment status
    - Delivery assignment (if assigned)
    - Timeline/history of status changes
    - **Actions**:
      - Update Status button
      - Assign Delivery button
      - Cancel Order button
      - Refund button (if applicable)

73. **Update Order Status Screen**
    - Current status display
    - Status selector dropdown
    - Notes/comment field
    - "Update Status" button
    - Cancel button

74. **Delivery Management - List Screen**
    - Screen title: "Delivery Personnel"
    - **Search and Filters**:
      - Search bar
      - Filter by status (Active, Inactive, Available, Offline)
      - Sort options
    - **Actions**:
      - "Add Delivery Person" button (if applicable)
    - **Delivery Personnel Table/List**:
      - Columns: Name, Phone, Status, Rating, Total Deliveries, Earnings, Actions
      - Each row shows:
        - Profile picture
        - Name
        - Phone number
        - Status badge (Available/Offline)
        - Rating
        - Total deliveries
        - Total earnings
        - Actions dropdown:
          - View Details
          - Edit
          - View Orders
          - Block/Unblock
    - Pagination

75. **Delivery Person Details Screen** (Admin view)
    - Profile information
    - Contact details
    - Vehicle information
    - Document status
    - Bank account details (masked)
    - Statistics (deliveries, earnings, rating)
    - Active assignments
    - Order history
    - **Actions**:
      - Edit button
      - Block/Unblock button
      - View Documents button

76. **Assign Order to Delivery Screen**
    - Order details summary
    - Available delivery personnel list
    - Each delivery person shows:
      - Name and rating
      - Current status
      - Distance from pickup location
      - Active deliveries count
    - "Assign" button for each person
    - Map view showing locations (optional)

77. **Analytics & Reports Screen**
    - Screen title: "Analytics"
    - **Time Period Selector**: Today, Week, Month, Year, Custom Range
    - **Revenue Analytics**:
      - Total revenue chart
      - Revenue by category
      - Revenue trends
    - **User Analytics**:
      - User growth chart
      - Active users
      - New signups
      - User retention
    - **Course Analytics**:
      - Popular courses
      - Course completion rates
      - Category performance
    - **Order Analytics**:
      - Orders over time
      - Average order value
      - Order status distribution
    - **Delivery Analytics**:
      - Delivery completion rates
      - Average delivery time
      - Delivery person performance
    - Export reports button

78. **Admin Settings Screen**
    - Account settings
    - Platform settings
    - Payment gateway configuration
    - Email/SMS settings
    - Notification preferences
    - System logs
    - Backup settings
    - Change password
    - Logout

#### C. Confirmation & Feedback Modals

79. **Success Confirmation Modals**
    - Small pop-up overlays
    - Success checkmark icon
    - Success message (e.g., "User Added Successfully", "Course Updated", "Order Status Updated")
    - "OK" button
    - Auto-dismiss after few seconds

80. **Error/Alert Modals**
    - Small pop-up overlays
    - Error/alert icon
    - Error message
    - "OK" or "Cancel" button

81. **Confirmation Dialogs**
    - For destructive actions (Delete, Block, Cancel Order)
    - Warning icon
    - Confirmation message
    - "Confirm" button (red/destructive)
    - "Cancel" button (secondary)

---

## Screen Count Summary

**Student Flow**: 40 screens
**Delivery Flow**: 21 screens  
**Admin Flow**: 20 screens
**Total**: 81 screens documented

---

## Application Flows Summary

Based on the detailed screen inventory above, here are the main user flows:

---

## Additional Screens & Edge Cases

### Common UI Components Found Across Screens:

1. **Loading States**: Spinner/loading indicators for async operations
2. **Empty States**: Illustrated empty states for lists (cart, orders, courses, etc.)
3. **Error States**: Error messages and retry options
4. **Pull-to-Refresh**: On list screens
5. **Bottom Sheets/Modals**: For filters, options, confirmations
6. **Toast Notifications**: Brief success/error messages
7. **Image Viewers**: Full-screen image viewing
8. **Video Players**: For course previews and lessons

### Navigation Patterns:
- Bottom tab navigation (Student: Home, Search, Cart, Profile)
- Stack navigation (for detail screens)
- Drawer navigation (optional, for admin)
- Tab navigation (within screens like Analytics)

### Status Indicators:
- Order status badges (Pending, Processing, Shipped, Delivered, Cancelled)
- User status badges (Active, Blocked, Available, Offline)
- Course status badges (Draft, Pending, Published, Rejected)
- Payment status badges (Pending, Success, Failed, Refunded)

---

## Database Schema Requirements

### Core Entities & Relationships

#### 1. User Model (Base User Table)
```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  phoneNumber   String?   @unique @map("phone_number")
  passwordHash  String    @map("password_hash")
  gender        Gender?
  dateOfBirth   DateTime? @map("date_of_birth")
  location      String?
  profilePictureUrl String? @map("profile_picture_url")
  role          UserRole  @default(STUDENT)
  isActive      Boolean   @default(true) @map("is_active")
  emailVerified Boolean   @default(false) @map("email_verified")
  phoneVerified Boolean   @default(false) @map("phone_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  studentProfile       StudentProfile?
  doctorProfile        DoctorProfile?
  deliveryProfile      DeliveryProfile?
  adminProfile         AdminProfile?
  userRoles            UserRolePermission[]
  addresses            Address[]
  orders               Order[]
  reviews              Review[]
  productReviews       ProductReview[]
  notifications        Notification[]
  cart                 Cart?
  enrollments          Enrollment[]
  instructorCourses    Course[] @relation("InstructorCourses")
  customerRatings      CustomerRating[] @relation("CustomerRatings")
  deliveryRatings      CustomerRating[] @relation("DeliveryRatings")
  searchHistory        SearchHistory[]
  wholesaleCustomers   WholesaleCustomer?
  
  @@map("users")
}

enum UserRole {
  STUDENT
  DOCTOR
  DELIVERY
  ADMIN
  INSTRUCTOR
  WHOLESALE_CUSTOMER
  MANAGER
  MODERATOR
}

enum Gender {
  MALE
  FEMALE
  OTHER
}
```

#### 1.1. Student Table (Separate Student Management)
```prisma
model Student {
  id              String   @id @default(uuid())
  userId          String   @unique @map("user_id")
  studentId       String?  @unique @map("student_id") // Custom student ID
  enrollmentDate  DateTime? @map("enrollment_date")
  graduationDate  DateTime? @map("graduation_date")
  level           String?  // Beginner, Intermediate, Advanced
  totalCoursesCompleted Int @default(0) @map("total_courses_completed")
  totalPoints     Int      @default(0) @map("total_points")
  preferredLanguage String? @map("preferred_language")
  notes           String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  enrollments Enrollment[]

  @@map("students")
}
```

#### 1.2. Doctor Table (Separate Doctor/Instructor Management)
```prisma
model Doctor {
  id                  String   @id @default(uuid())
  userId              String   @unique @map("user_id")
  doctorId            String?  @unique @map("doctor_id") // Custom doctor ID
  specialization      String?  // Medical specialization, teaching subject, etc.
  qualifications      String?  @db.Text // Education, certifications
  experience          Int?     // Years of experience
  licenseNumber       String?  @map("license_number")
  licenseExpiry       DateTime? @map("license_expiry")
  bio                 String?  @db.Text
  expertise           String[] // Array of expertise areas
  languages           String[] // Languages spoken
  consultationFee     Decimal? @db.Decimal(10, 2) @map("consultation_fee")
  rating              Float    @default(0)
  totalReviews        Int      @default(0) @map("total_reviews")
  totalStudents       Int      @default(0) @map("total_students")
  totalCourses        Int      @default(0) @map("total_courses")
  isVerified          Boolean  @default(false) @map("is_verified")
  verificationDate    DateTime? @map("verification_date")
  documents           Json?    // Store document URLs (CV, certificates, etc.)
  bankDetails         Json?    // Bank account for payments
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courses         Course[]
  productReviews  ProductReview[]

  @@map("doctors")
}
```

#### 1.3. Role & Permission System
```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  isSystem    Boolean  @default(false) @map("is_system") // System roles cannot be deleted
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  permissions RolePermission[]
  userRoles   UserRolePermission[]

  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  resource    String   // e.g., "course", "product", "order", "user"
  action      String   // e.g., "create", "read", "update", "delete", "manage"
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  rolePermissions RolePermission[]

  @@map("permissions")
}

model RolePermission {
  id           String   @id @default(uuid())
  roleId       String   @map("role_id")
  permissionId String   @map("permission_id")
  createdAt    DateTime @default(now()) @map("created_at")

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserRolePermission {
  id       String   @id @default(uuid())
  userId   String   @map("user_id")
  roleId   String   @map("role_id")
  grantedBy String? @map("granted_by") // Admin who granted this role
  expiresAt DateTime? @map("expires_at") // Optional expiry date
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_role_permissions")
}
```

#### 1.4. Wholesale Customer Model
```prisma
model WholesaleCustomer {
  id                String   @id @default(uuid())
  userId            String   @unique @map("user_id")
  companyName       String   @map("company_name")
  taxId             String?  @unique @map("tax_id")
  businessLicense   String?  @map("business_license")
  contactPerson     String   @map("contact_person")
  discountTier      String   @default("STANDARD") @map("discount_tier") // STANDARD, SILVER, GOLD, PLATINUM
  discountPercentage Decimal @default(0) @db.Decimal(5, 2) @map("discount_percentage")
  creditLimit       Decimal? @db.Decimal(10, 2) @map("credit_limit")
  paymentTerms      String?  @map("payment_terms") // e.g., "Net 30", "Net 60"
  isApproved        Boolean  @default(false) @map("is_approved")
  approvedBy        String?  @map("approved_by")
  approvedAt        DateTime? @map("approved_at")
  notes             String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("wholesale_customers")
}
```

#### 2. Student Profile Model (Legacy - use Student table instead)
```prisma
model StudentProfile {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("student_profiles")
}
```

#### 3. Delivery Profile Model
```prisma
model DeliveryProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique @map("user_id")
  vehicleType         String?  @map("vehicle_type")
  licenseNumber       String?  @map("license_number")
  bankAccountNumber   String?  @map("bank_account_number")
  bankAccountName     String?  @map("bank_account_name")
  bankName            String?  @map("bank_name")
  idDocumentUrl       String?  @map("id_document_url")
  licenseDocumentUrl  String?  @map("license_document_url")
  vehicleDocumentUrl  String?  @map("vehicle_document_url")
  isAvailable         Boolean  @default(true) @map("is_available")
  rating              Float    @default(0)
  totalDeliveries     Int      @default(0) @map("total_deliveries")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignments DeliveryAssignment[]
  payouts     Payout[]

  @@map("delivery_profiles")
}
```

#### 4. Admin Profile Model
```prisma
model AdminProfile {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  permissions Json?  // Store admin permissions as JSON
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("admin_profiles")
}
```

#### 5. OTP Model
```prisma
model OTP {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  code      String
  type      OTPType  // EMAIL_VERIFICATION, PHONE_VERIFICATION, PASSWORD_RESET
  expiresAt DateTime @map("expires_at")
  isUsed    Boolean  @default(false) @map("is_used")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, code])
  @@map("otps")
}

enum OTPType {
  EMAIL_VERIFICATION
  PHONE_VERIFICATION
  PASSWORD_RESET
}
```

#### 6. Category Model
```prisma
model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  iconUrl   String?  @map("icon_url")
  slug      String   @unique
  type      CategoryType @default(COURSE) // COURSE or PRODUCT
  parentId  String?  @map("parent_id") // For sub-categories
  description String? @db.Text
  isActive  Boolean  @default(true) @map("is_active")
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  courses  Course[]
  products Product[]

  @@index([type])
  @@map("categories")
}

enum CategoryType {
  COURSE
  PRODUCT
  BOTH
}
```

#### 7. Course Model
```prisma
model Course {
  id              String      @id @default(uuid())
  title           String
  description     String      @db.Text
  price           Decimal     @db.Decimal(10, 2)
  imageUrl        String?     @map("image_url")
  videoUrl        String?     @map("video_url")
  instructorId    String      @map("instructor_id")
  categoryId      String      @map("category_id")
  rating          Float       @default(0)
  numberOfReviews Int         @default(0) @map("number_of_reviews")
  status          CourseStatus @default(DRAFT)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  instructor   User      @relation("InstructorCourses", fields: [instructorId], references: [id])
  category     Category  @relation(fields: [categoryId], references: [id])
  lessons      Lesson[]
  reviews      Review[]
  cartItems    CartItem[]
  orderItems   OrderItem[]
  enrollments  Enrollment[]

  @@map("courses")
}

enum CourseStatus {
  DRAFT
  PENDING
  PUBLISHED
  ARCHIVED
  REJECTED
}
```

#### 7.1. Product Model (Wholesale/Retail Products)
```prisma
model Product {
  id              String      @id @default(uuid())
  name            String
  sku             String      @unique // Stock Keeping Unit
  barcode         String?     @unique
  description     String      @db.Text
  shortDescription String?    @db.Text @map("short_description")
  
  // Pricing
  retailPrice     Decimal     @db.Decimal(10, 2) @map("retail_price")
  wholesalePrice  Decimal?    @db.Decimal(10, 2) @map("wholesale_price")
  costPrice       Decimal?    @db.Decimal(10, 2) @map("cost_price") // For profit calculation
  
  // Images
  imageUrl        String?     @map("image_url")
  gallery         String[]    // Array of image URLs
  
  // Inventory
  stockQuantity   Int         @default(0) @map("stock_quantity")
  lowStockThreshold Int       @default(10) @map("low_stock_threshold")
  manageStock     Boolean     @default(true) @map("manage_stock")
  stockStatus     StockStatus @default(IN_STOCK) @map("stock_status")
  
  // Product Details
  categoryId      String      @map("category_id")
  brand           String?
  weight          Decimal?    @db.Decimal(10, 2) // in kg
  dimensions      String?     // JSON: {length, width, height}
  unit            String      @default("piece") // piece, kg, liter, etc.
  
  // Wholesale Settings
  minWholesaleQuantity Int?   @default(1) @map("min_wholesale_quantity")
  wholesaleTiers Json?        // Quantity-based pricing tiers
  allowWholesale Boolean      @default(false) @map("allow_wholesale")
  
  // Status & SEO
  status          ProductStatus @default(DRAFT)
  slug            String      @unique
  metaTitle       String?     @map("meta_title")
  metaDescription String?     @db.Text @map("meta_description")
  
  // Attributes
  attributes      Json?       // Product attributes (color, size, etc.)
  variations      Json?       // Product variations
  
  rating          Float       @default(0)
  numberOfReviews Int         @default(0) @map("number_of_reviews")
  totalSales      Int         @default(0) @map("total_sales")
  
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  publishedAt     DateTime?   @map("published_at")

  category      Category        @relation(fields: [categoryId], references: [id])
  reviews       ProductReview[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
  productImages ProductImage[]

  @@index([categoryId])
  @@index([status])
  @@index([sku])
  @@map("products")
}

enum ProductStatus {
  DRAFT
  PENDING
  PUBLISHED
  ARCHIVED
  OUT_OF_STOCK
}

enum StockStatus {
  IN_STOCK
  OUT_OF_STOCK
  BACKORDER
  ON_BACKORDER
}
```

#### 7.2. Product Image Model
```prisma
model ProductImage {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  imageUrl  String   @map("image_url")
  altText   String?  @map("alt_text")
  sortOrder Int      @default(0) @map("sort_order")
  isPrimary Boolean  @default(false) @map("is_primary")
  createdAt DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_images")
}
```

#### 7.3. Product Review Model
```prisma
model ProductReview {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  userId    String   @map("user_id")
  doctorId  String?  @map("doctor_id") // If review is from a doctor/expert
  rating    Int      // 1-5 stars
  title     String?
  comment   String?  @db.Text
  verifiedPurchase Boolean @default(false) @map("verified_purchase")
  helpful   Int      @default(0) // Number of helpful votes
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  doctor  Doctor? @relation(fields: [doctorId], references: [id], onDelete: SetNull)

  @@unique([productId, userId])
  @@map("product_reviews")
}
```

#### 7.4. Product Import/Export Log Model
```prisma
model ProductImportLog {
  id            String            @id @default(uuid())
  fileName      String            @map("file_name")
  filePath      String            @map("file_path")
  fileType      String            @default("EXCEL") @map("file_type")
  totalRows     Int               @map("total_rows")
  successCount  Int               @default(0) @map("success_count")
  errorCount    Int               @default(0) @map("error_count")
  status        ImportStatus      @default(PENDING)
  errors        Json?             // Array of error details
  importedBy    String            @map("imported_by") // User ID
  startedAt     DateTime          @default(now()) @map("started_at")
  completedAt   DateTime?         @map("completed_at")
  createdAt     DateTime          @default(now()) @map("created_at")

  @@index([status])
  @@index([importedBy])
  @@map("product_import_logs")
}

enum ImportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

#### 8. Lesson Model
```prisma
model Lesson {
  id          String   @id @default(uuid())
  courseId    String   @map("course_id")
  title       String
  description String?  @db.Text
  content     String?  @db.Text // Can be text, video URL, or document URL
  contentType String   @default("VIDEO") @map("content_type")
  orderIndex  Int      @map("order_index")
  duration    Int?     // Duration in minutes
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress LessonProgress[]

  @@map("lessons")
}

enum ContentType {
  VIDEO
  TEXT
  DOCUMENT
  QUIZ
}
```

#### 9. Review Model
```prisma
model Review {
  id        String   @id @default(uuid())
  courseId  String   @map("course_id")
  userId    String   @map("user_id")
  rating    Int      // 1-5 stars
  comment   String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@map("reviews")
}
```

#### 10. Cart & CartItem Models
```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique @map("user_id")
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]

  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String   @map("cart_id")
  itemType  OrderItemType @map("item_type") // COURSE or PRODUCT
  courseId  String?  @map("course_id")
  productId String?  @map("product_id")
  quantity  Int      @default(1)
  isWholesale Boolean @default(false) @map("is_wholesale")
  createdAt DateTime @default(now()) @map("created_at")

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  course  Course? @relation(fields: [courseId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([cartId, courseId, productId])
  @@map("cart_items")
}
```

#### 11. Address Model
```prisma
model Address {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  street     String
  city       String
  state      String?
  zipCode    String?  @map("zip_code")
  country    String   @default("Egypt")
  isDefault  Boolean  @default(false) @map("is_default")
  latitude   Float?
  longitude  Float?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders Order[]

  @@map("addresses")
}
```

#### 12. Order & OrderItem Models
```prisma
model Order {
  id                String        @id @default(uuid())
  userId            String        @map("user_id")
  deliveryAddressId String        @map("delivery_address_id")
  paymentMethod     PaymentMethod @map("payment_method")
  orderType         OrderType     @default(MIXED) @map("order_type") // RETAIL, WHOLESALE, MIXED
  subtotal          Decimal       @db.Decimal(10, 2)
  discountAmount    Decimal       @default(0) @db.Decimal(10, 2) @map("discount_amount")
  taxAmount         Decimal       @default(0) @db.Decimal(10, 2) @map("tax_amount")
  shippingAmount    Decimal       @default(0) @db.Decimal(10, 2) @map("shipping_amount")
  totalAmount       Decimal       @db.Decimal(10, 2) @map("total_amount")
  status            OrderStatus   @default(PENDING)
  deliveryPersonId  String?       @map("delivery_person_id")
  orderNumber       String        @unique @map("order_number") // Format: ORD-YYYYMMDD-XXXX
  notes             String?       @db.Text
  isWholesale       Boolean       @default(false) @map("is_wholesale")
  wholesaleDiscount Decimal?      @db.Decimal(5, 2) @map("wholesale_discount") // Percentage
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  user            User                @relation(fields: [userId], references: [id])
  deliveryAddress Address             @relation(fields: [deliveryAddressId], references: [id])
  items           OrderItem[]
  payment         Payment?
  assignment      DeliveryAssignment?
  statusHistory   OrderStatusHistory[]
  customerRating  CustomerRating?
  payout          Payout?

  @@index([userId])
  @@index([status])
  @@index([orderType])
  @@index([createdAt])
  @@map("orders")
}

enum OrderType {
  RETAIL
  WHOLESALE
  MIXED
}

model OrderItem {
  id             String   @id @default(uuid())
  orderId        String   @map("order_id")
  itemType       OrderItemType @map("item_type") // COURSE or PRODUCT
  courseId       String?  @map("course_id")
  productId      String?  @map("product_id")
  priceAtPurchase Decimal @db.Decimal(10, 2) @map("price_at_purchase")
  quantity       Int      @default(1)
  isWholesale    Boolean  @default(false) @map("is_wholesale")
  discountAmount Decimal  @default(0) @db.Decimal(10, 2) @map("discount_amount")
  subtotal       Decimal  @db.Decimal(10, 2)
  createdAt      DateTime @default(now()) @map("created_at")

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  course  Course? @relation(fields: [courseId], references: [id], onDelete: SetNull)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([itemType])
  @@map("order_items")
}

enum OrderItemType {
  COURSE
  PRODUCT
}

enum PaymentMethod {
  CREDIT_CARD
  PAYPAL
  CASH_ON_DELIVERY
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}
```

#### 13. Payment Model
```prisma
model Payment {
  id            String        @id @default(uuid())
  orderId       String        @unique @map("order_id")
  transactionId String?       @map("transaction_id") // From payment gateway
  amount        Decimal       @db.Decimal(10, 2)
  status        PaymentStatus @default(PENDING)
  paymentDate   DateTime?     @map("payment_date")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("payments")
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
  CANCELLED
}
```

#### 14. Delivery Assignment Model
```prisma
model DeliveryAssignment {
  id               String              @id @default(uuid())
  orderId          String              @unique @map("order_id")
  deliveryPersonId String              @map("delivery_person_id")
  status           AssignmentStatus    @default(ASSIGNED)
  pickupLocation   String              @map("pickup_location")
  deliveryLocation String              @map("delivery_location")
  pickupLatitude   Float?              @map("pickup_latitude")
  pickupLongitude  Float?              @map("pickup_longitude")
  deliveryLatitude Float?              @map("delivery_latitude")
  deliveryLongitude Float?             @map("delivery_longitude")
  estimatedEarnings Decimal            @db.Decimal(10, 2) @map("estimated_earnings")
  acceptedAt       DateTime?           @map("accepted_at")
  pickedUpAt       DateTime?           @map("picked_up_at")
  deliveredAt      DateTime?           @map("delivered_at")
  createdAt        DateTime            @default(now()) @map("created_at")
  updatedAt        DateTime            @updatedAt @map("updated_at")

  order           Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  deliveryProfile DeliveryProfile @relation(fields: [deliveryPersonId], references: [userId])

  @@index([deliveryPersonId])
  @@index([status])
  @@map("delivery_assignments")
}

enum AssignmentStatus {
  ASSIGNED
  ACCEPTED
  REJECTED
  PICKED_UP
  DELIVERED
  CANCELLED
}
```

#### 15. Notification Model
```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  title     String
  message   String           @db.Text
  type      NotificationType
  isRead    Boolean          @default(false) @map("is_read")
  relatedId String?          @map("related_id") // ID of related order, course, etc.
  createdAt DateTime         @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

enum NotificationType {
  ORDER_UPDATE
  NEW_COURSE
  PROMOTION
  SYSTEM
  DELIVERY_ASSIGNMENT
  PAYMENT_SUCCESS
  PAYMENT_FAILED
}
```

#### 16. Enrollment Model (for tracking course access)
```prisma
model Enrollment {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  courseId  String   @map("course_id")
  orderId   String?  @map("order_id") // Link to order that granted access
  enrolledAt DateTime @default(now()) @map("enrolled_at")
  completedAt DateTime? @map("completed_at")
  progress   Int      @default(0) // Percentage 0-100

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  course         Course          @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessonProgress LessonProgress[]

  @@unique([userId, courseId])
  @@map("enrollments")
}
```

#### 17. Lesson Progress Model (tracking individual lesson completion)
```prisma
model LessonProgress {
  id          String   @id @default(uuid())
  enrollmentId String  @map("enrollment_id")
  lessonId    String   @map("lesson_id")
  isCompleted Boolean  @default(false) @map("is_completed")
  completedAt DateTime? @map("completed_at")
  timeSpent   Int      @default(0) @map("time_spent") // in minutes
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson     Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([enrollmentId, lessonId])
  @@map("lesson_progress")
}
```

#### 18. Customer Rating Model (delivery person rates customer)
```prisma
model CustomerRating {
  id               String   @id @default(uuid())
  orderId          String   @unique @map("order_id")
  deliveryPersonId String   @map("delivery_person_id")
  customerId       String   @map("customer_id")
  rating           Int      // 1-5 stars
  comment          String?  @db.Text
  createdAt        DateTime @default(now()) @map("created_at")

  order          Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  deliveryPerson User   @relation("DeliveryRatings", fields: [deliveryPersonId], references: [id])
  customer       User   @relation("CustomerRatings", fields: [customerId], references: [id])

  @@map("customer_ratings")
}
```

#### 19. Payout Model (for delivery personnel earnings)
```prisma
model Payout {
  id               String        @id @default(uuid())
  deliveryPersonId String        @map("delivery_person_id")
  amount           Decimal       @db.Decimal(10, 2)
  status           PayoutStatus  @default(PENDING)
  periodStart      DateTime      @map("period_start")
  periodEnd        DateTime      @map("period_end")
  transactionId    String?       @map("transaction_id") // Bank transaction reference
  payoutDate       DateTime?     @map("payout_date")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  deliveryProfile DeliveryProfile @relation(fields: [deliveryPersonId], references: [userId])
  orders          Order[]         // Orders included in this payout

  @@index([deliveryPersonId])
  @@index([status])
  @@map("payouts")
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

#### 20. Order Status History Model (tracking order status changes)
```prisma
model OrderStatusHistory {
  id        String      @id @default(uuid())
  orderId   String      @map("order_id")
  status    OrderStatus
  changedBy String?     @map("changed_by") // User ID who changed the status (admin, system)
  notes     String?     @db.Text
  createdAt DateTime    @default(now()) @map("created_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_status_history")
}
```

#### 21. Search History Model (for recent searches)
```prisma
model SearchHistory {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  query     String
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("search_history")
}
```

#### 22. Report Model (Generated Reports)
```prisma
model Report {
  id          String      @id @default(uuid())
  name        String
  type        ReportType
  format      ReportFormat @default(PDF) // PDF, EXCEL, CSV
  parameters  Json?       // Filter parameters used
  filePath    String?     @map("file_path") // Path to generated file
  fileUrl     String?     @map("file_url")
  status      ReportStatus @default(PENDING)
  generatedBy String      @map("generated_by") // User ID
  startedAt   DateTime    @default(now()) @map("started_at")
  completedAt DateTime?   @map("completed_at")
  expiresAt   DateTime?   @map("expires_at") // File retention period
  errorMessage String?    @db.Text @map("error_message")
  createdAt   DateTime    @default(now()) @map("created_at")

  @@index([type])
  @@index([status])
  @@index([generatedBy])
  @@map("reports")
}

enum ReportType {
  SALES_REPORT
  PRODUCT_SALES
  COURSE_SALES
  ORDER_REPORT
  USER_REPORT
  INVENTORY_REPORT
  REVENUE_REPORT
  WHOLESALE_REPORT
  DELIVERY_REPORT
  CUSTOM
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
  JSON
}

enum ReportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}
```

---

## API Endpoints Requirements

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh-token` - Refresh access token

### User Profile Endpoints
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile/picture` - Upload profile picture
- `POST /api/users/profile/complete` - Complete profile setup (student)
- `POST /api/users/profile/delivery` - Complete delivery profile
- `PUT /api/users/password` - Change password

### Category Endpoints
- `GET /api/categories` - Get all categories (with type filter: COURSE, PRODUCT, BOTH)
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)
- `GET /api/categories/product` - Get product categories only
- `GET /api/categories/course` - Get course categories only

### Course Endpoints
- `GET /api/courses` - Get all courses (with filters: category, search, price range)
- `GET /api/courses/popular` - Get popular courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/lessons` - Get course lessons
- `POST /api/courses` - Create course (Instructor/Admin only)
- `PUT /api/courses/:id` - Update course (Instructor/Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)
- `POST /api/courses/:id/publish` - Publish course (Admin only)
- `POST /api/courses/:id/reject` - Reject course (Admin only)

### Review Endpoints
- `GET /api/courses/:id/reviews` - Get course reviews
- `POST /api/courses/:id/reviews` - Create review (Student only)
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Cart Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Address Endpoints
- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Create address
- `GET /api/addresses/:id` - Get address by ID
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PUT /api/addresses/:id/default` - Set default address

### Order Endpoints
- `GET /api/orders` - Get user orders (with filters: status, date range)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order (checkout)
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/track` - Track order status
- `GET /api/orders/:id/invoice` - Get/download order invoice

### Payment Endpoints
- `POST /api/payments` - Process payment
- `POST /api/payments/webhook` - Payment webhook (Stripe/PayPal)
- `GET /api/payments/:id` - Get payment details

### Enrollment Endpoints
- `GET /api/enrollments` - Get user enrollments (with filters: in-progress, completed)
- `GET /api/enrollments/:courseId` - Get enrollment for specific course
- `PUT /api/enrollments/:courseId/progress` - Update course progress
- `GET /api/enrollments/:courseId/lessons` - Get course lessons (for enrolled user)
- `PUT /api/enrollments/:courseId/lessons/:lessonId/complete` - Mark lesson as complete

### Delivery Endpoints
- `GET /api/delivery/orders` - Get available orders (with filters: distance, earnings)
- `GET /api/delivery/orders/:id` - Get order details (for delivery person)
- `GET /api/delivery/assignments` - Get delivery person assignments (with status filter)
- `GET /api/delivery/assignments/active` - Get active assignments
- `GET /api/delivery/assignments/:id` - Get assignment details
- `POST /api/delivery/assignments/:id/accept` - Accept assignment
- `POST /api/delivery/assignments/:id/reject` - Reject assignment
- `POST /api/delivery/assignments/:id/pickup` - Mark as picked up
- `POST /api/delivery/assignments/:id/deliver` - Mark as delivered
- `PUT /api/delivery/availability` - Update availability status (Available/Offline)
- `GET /api/delivery/earnings` - Get earnings (with time period: daily/weekly/monthly)
- `GET /api/delivery/earnings/summary` - Get earnings summary
- `GET /api/delivery/payouts` - Get payout history
- `GET /api/delivery/payouts/:id` - Get payout details
- `GET /api/delivery/history` - Get delivery history (with filters)
- `POST /api/delivery/orders/:id/rate-customer` - Rate customer after delivery
- `GET /api/delivery/orders/:id/customer-rating` - Get customer rating for order

### Admin Endpoints
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (with filters: role, status, search)
- `GET /api/admin/users/:id` - Get user details (admin view)
- `POST /api/admin/users` - Create new user (if applicable)
- `PUT /api/admin/users/:id` - Update user details
- `PUT /api/admin/users/:id/block` - Block/unblock user
- `DELETE /api/admin/users/:id` - Delete user (if applicable)
- `POST /api/admin/users/:id/reset-password` - Reset user password
- `GET /api/admin/orders` - Get all orders (with filters: status, date range, customer)
- `GET /api/admin/orders/:id` - Get order details (admin view)
- `PUT /api/admin/orders/:id/status` - Update order status
- `POST /api/admin/orders/:id/assign-delivery` - Assign order to delivery person
- `POST /api/admin/orders/:id/cancel` - Cancel order (admin)
- `POST /api/admin/orders/:id/refund` - Process refund
- `GET /api/admin/courses` - Get all courses (with filters: status, category, instructor)
- `GET /api/admin/courses/pending` - Get pending courses
- `GET /api/admin/courses/:id` - Get course details (admin view)
- `POST /api/admin/courses` - Create course (admin)
- `PUT /api/admin/courses/:id` - Update course (admin)
- `DELETE /api/admin/courses/:id` - Delete course
- `POST /api/admin/courses/:id/approve` - Approve course
- `POST /api/admin/courses/:id/reject` - Reject course (with reason)
- `POST /api/admin/courses/:id/publish` - Publish course
- `POST /api/admin/courses/:id/unpublish` - Unpublish course
- `GET /api/admin/delivery` - Get all delivery personnel (with filters)
- `GET /api/admin/delivery/:id` - Get delivery person details
- `PUT /api/admin/delivery/:id` - Update delivery person
- `PUT /api/admin/delivery/:id/block` - Block/unblock delivery person
- `GET /api/admin/delivery/:id/orders` - Get orders for delivery person
- `POST /api/admin/delivery/assign` - Assign order to delivery person
- `GET /api/admin/analytics` - Get analytics data (with time range filters)
- `GET /api/admin/analytics/revenue` - Get revenue analytics
- `GET /api/admin/analytics/users` - Get user analytics
- `GET /api/admin/analytics/courses` - Get course analytics
- `GET /api/admin/analytics/orders` - Get order analytics
- `GET /api/admin/analytics/delivery` - Get delivery analytics
- `GET /api/admin/reports/export` - Export reports (CSV/PDF)

### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Search Endpoints
- `GET /api/search` - Global search (courses, products, instructors)
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/popular` - Popular searches
- `GET /api/search/history` - Get user search history
- `DELETE /api/search/history` - Clear search history
- `DELETE /api/search/history/:id` - Delete specific search history item

### Product Endpoints
- `GET /api/products` - Get all products (with filters: category, search, price range, stock status)
- `GET /api/products/popular` - Get popular products
- `GET /api/products/:id` - Get product details
- `GET /api/products/wholesale` - Get wholesale products (Wholesale customers only)
- `POST /api/products` - Create product (Admin/Manager only)
- `PUT /api/products/:id` - Update product (Admin/Manager only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `POST /api/products/:id/publish` - Publish product
- `POST /api/products/:id/unpublish` - Unpublish product
- `GET /api/products/:id/reviews` - Get product reviews
- `POST /api/products/:id/reviews` - Create product review
- `PUT /api/products/reviews/:id` - Update review
- `DELETE /api/products/reviews/:id` - Delete review
- `GET /api/products/inventory/low-stock` - Get low stock products (Admin/Manager)
- `PUT /api/products/:id/stock` - Update product stock (Admin/Manager)

### Product Import/Export Endpoints
- `POST /api/products/import` - Import products from Excel file (Admin/Manager only)
- `GET /api/products/import/template` - Download Excel import template
- `GET /api/products/import/logs` - Get import history
- `GET /api/products/import/logs/:id` - Get import log details
- `GET /api/products/export` - Export products to Excel/CSV (Admin/Manager only)
- `POST /api/products/bulk-update` - Bulk update products (Admin/Manager only)
- `DELETE /api/products/bulk-delete` - Bulk delete products (Admin only)

### Wholesale Endpoints
- `GET /api/wholesale/products` - Get wholesale product catalog (Wholesale customers)
- `GET /api/wholesale/pricing` - Get wholesale pricing tiers
- `POST /api/wholesale/register` - Register as wholesale customer
- `GET /api/wholesale/profile` - Get wholesale customer profile
- `PUT /api/wholesale/profile` - Update wholesale customer profile
- `GET /api/wholesale/orders` - Get wholesale orders
- `POST /api/wholesale/orders` - Create wholesale order

### Student Endpoints
- `GET /api/students` - Get all students (Admin/Manager only)
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create student (Admin only)
- `PUT /api/students/:id` - Update student
- `GET /api/students/:id/courses` - Get student enrolled courses
- `GET /api/students/:id/progress` - Get student progress summary

### Doctor/Instructor Endpoints
- `GET /api/doctors` - Get all doctors/instructors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors/register` - Register as doctor/instructor
- `PUT /api/doctors/:id` - Update doctor profile
- `PUT /api/doctors/:id/verify` - Verify doctor (Admin only)
- `GET /api/doctors/:id/courses` - Get doctor's courses
- `GET /api/doctors/:id/reviews` - Get doctor reviews

### Role & Permission Endpoints
- `GET /api/roles` - Get all roles (Admin only)
- `GET /api/roles/:id` - Get role details
- `POST /api/roles` - Create role (Admin only)
- `PUT /api/roles/:id` - Update role (Admin only)
- `DELETE /api/roles/:id` - Delete role (Admin only)
- `GET /api/permissions` - Get all permissions (Admin only)
- `GET /api/permissions/:id` - Get permission details
- `POST /api/permissions` - Create permission (Admin only)
- `GET /api/roles/:id/permissions` - Get role permissions
- `POST /api/roles/:id/permissions` - Assign permissions to role (Admin only)
- `DELETE /api/roles/:id/permissions/:permissionId` - Remove permission from role (Admin only)
- `GET /api/users/:id/roles` - Get user roles
- `POST /api/users/:id/roles` - Assign role to user (Admin only)
- `DELETE /api/users/:id/roles/:roleId` - Remove role from user (Admin only)
- `GET /api/users/:id/permissions` - Get user effective permissions

### Reports Endpoints
- `GET /api/reports` - Get all reports (with filters)
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/:id/download` - Download report file
- `POST /api/reports/sales` - Generate sales report (Admin/Manager)
- `POST /api/reports/products` - Generate product sales report (Admin/Manager)
- `POST /api/reports/courses` - Generate course sales report (Admin/Manager)
- `POST /api/reports/orders` - Generate order report (Admin/Manager)
- `POST /api/reports/users` - Generate user report (Admin only)
- `POST /api/reports/inventory` - Generate inventory report (Admin/Manager)
- `POST /api/reports/revenue` - Generate revenue report (Admin only)
- `POST /api/reports/wholesale` - Generate wholesale report (Admin/Manager)
- `POST /api/reports/delivery` - Generate delivery report (Admin/Manager)
- `POST /api/reports/custom` - Generate custom report (Admin only)
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/templates` - Get available report templates

---

## Technology Stack Requirements

### Backend Framework
- **Node.js** (v18 or higher)
- **Express.js** or **Fastify** for REST API
- **TypeScript** for type safety

### Database & ORM
- **MySQL** (v8.0 or higher)
- **Prisma** as ORM
- **Prisma Migrate** for database migrations

### Authentication & Security
- **JWT** (JSON Web Tokens) for authentication
- **bcrypt** for password hashing
- **express-rate-limit** for rate limiting
- **helmet** for security headers
- **cors** for CORS handling

### Validation
- **Zod** or **Joi** for request validation
- Prisma validation for database level

### File Upload
- **Multer** or **Cloudinary** for image/file uploads
- Support for profile pictures, course images, product images, documents

### Excel Processing
- **xlsx** or **exceljs** for Excel file reading/writing
- **csv-parser** for CSV file processing
- Excel import/export functionality for products

### Payment Integration
- **Stripe** or **PayPal SDK** for payment processing
- Webhook handling for payment confirmations
- Support for credit terms for wholesale customers

### Maps & Location
- **Google Maps API** or similar for location services
- Geocoding for address validation
- Distance calculation for delivery

### Real-time Features (Optional)
- **Socket.io** for real-time notifications
- Real-time order updates for delivery personnel

### Email/SMS Services
- **Nodemailer** or **SendGrid** for emails (OTP, notifications)
- **Twilio** or similar for SMS (OTP verification)

### Report Generation
- **pdfkit** or **puppeteer** for PDF generation
- **exceljs** for Excel report generation
- **csv-writer** for CSV report generation
- Report templates and formatting

### Environment Variables
- Database connection strings
- JWT secrets
- Payment gateway keys
- Email/SMS service credentials
- File upload configuration
- Maps API keys
- Excel file upload size limits
- Report file storage paths

---

## Key Features to Implement

### 1. Multi-Role Authentication System
- Separate registration flows for Students, Delivery, and Admin
- Role-based access control (RBAC)
- JWT token management with refresh tokens
- OTP verification for email and phone

### 2. Course Management System
- CRUD operations for courses
- Course approval workflow for admins
- Course categorization and search
- Course rating and review system
- Course content (lessons) management
- Instructor management

### 3. Shopping Cart & Checkout
- Shopping cart with persistent storage
- Multiple address management
- Multiple payment methods
- Order creation and tracking
- Order status management

### 4. Delivery Management System
- Order assignment to delivery personnel
- Real-time order acceptance/rejection
- Pickup and delivery tracking
- Earnings calculation for delivery personnel
- Delivery rating system

### 5. Notification System
- In-app notifications
- Email notifications
- Push notifications (if mobile app integration)
- Notification preferences

### 6. Admin Dashboard
- User management (view, block/unblock)
- Course management (approve/reject)
- Order management
- Delivery personnel management
- Analytics and reporting

### 7. Search & Discovery
- Course search with filters
- Category-based browsing
- Popular courses algorithm
- Search suggestions

### 8. Enrollment System
- Automatic enrollment after order completion
- Course progress tracking
- Completion certificates (future feature)

---

## Database Indexes Required

1. **User table**: Index on `email`, `phoneNumber`, `role`
2. **Student table**: Index on `userId`, `studentId`
3. **Doctor table**: Index on `userId`, `doctorId`, `isVerified`
4. **Course table**: Index on `categoryId`, `instructorId`, `status`, `rating`
5. **Product table**: Index on `categoryId`, `status`, `sku`, `barcode`, `stockStatus`
6. **Order table**: Index on `userId`, `status`, `orderType`, `createdAt`
7. **OrderItem table**: Index on `orderId`, `itemType`, `courseId`, `productId`
8. **DeliveryAssignment table**: Index on `deliveryPersonId`, `status`
9. **Notification table**: Index on `userId`, `isRead`, `createdAt`
10. **Review table**: Unique index on `[courseId, userId]`
11. **ProductReview table**: Unique index on `[productId, userId]`
12. **CartItem table**: Unique index on `[cartId, courseId, productId]`
13. **Enrollment table**: Unique index on `[userId, courseId]`
14. **Category table**: Index on `type`, `parentId`
15. **Role table**: Index on `slug`
16. **Permission table**: Index on `slug`, `resource`
17. **RolePermission table**: Unique index on `[roleId, permissionId]`
18. **UserRolePermission table**: Unique index on `[userId, roleId]`
19. **WholesaleCustomer table**: Index on `userId`, `isApproved`
20. **Report table**: Index on `type`, `status`, `generatedBy`
21. **ProductImportLog table**: Index on `status`, `importedBy`

---

## Security Considerations

1. **Password Security**: Use bcrypt with salt rounds (minimum 10)
2. **JWT Security**: Use secure, random secrets; set appropriate expiration times
3. **SQL Injection**: Prisma handles parameterized queries
4. **XSS Protection**: Validate and sanitize all user inputs
5. **CSRF Protection**: Implement CSRF tokens for state-changing operations
6. **Rate Limiting**: Implement on authentication and payment endpoints
7. **File Upload Security**: Validate file types, sizes, and scan for malware
8. **API Authentication**: Protect all routes except public ones
9. **Role-Based Access**: Verify user roles for all protected endpoints
10. **Data Encryption**: Encrypt sensitive data (bank details, payment info)
11. **HTTPS**: Enforce HTTPS in production
12. **Environment Variables**: Never commit secrets to version control

---

## Development Guidelines

### Code Structure
```
studify-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── course.controller.ts
│   │   ├── order.controller.ts
│   │   ├── delivery.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── course.routes.ts
│   │   ├── order.routes.ts
│   │   ├── delivery.routes.ts
│   │   └── admin.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   ├── payment.service.ts
│   │   ├── file-upload.service.ts
│   │   └── notification.service.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── app.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Error Handling
- Implement centralized error handling
- Use appropriate HTTP status codes
- Return consistent error response format
- Log errors appropriately

### API Response Format
```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### Validation
- Validate all request inputs
- Use Zod or Joi schemas
- Return clear validation error messages
- Validate at both route and service levels

### Logging
- Use a logging library (Winston, Pino)
- Log important operations (auth, payments, orders)
- Log errors with stack traces
- Use different log levels (info, warn, error)

### Testing
- Unit tests for services and utilities
- Integration tests for API endpoints
- Test authentication and authorization
- Test payment flows
- Test order workflows

---

## Additional Requirements

### Performance
- Implement pagination for list endpoints
- Use database indexes for frequently queried fields
- Implement caching where appropriate (Redis)
- Optimize database queries (avoid N+1 problems)
- Use connection pooling for database

### Scalability
- Design for horizontal scaling
- Stateless API design
- Consider message queues for async operations (Bull, RabbitMQ)
- Separate file storage (S3, Cloudinary)

### Monitoring & Analytics
- Health check endpoint (`GET /api/health`)
- Error tracking (Sentry)
- API analytics
- Database query monitoring

### Documentation
- API documentation (Swagger/OpenAPI)
- Database schema documentation
- Setup and deployment guides
- Environment variable documentation

---

## Implementation Priority

### Phase 1: Core Setup
1. Project initialization with Node.js, TypeScript, Express
2. Prisma setup with MySQL
3. Database schema implementation
4. Authentication system (JWT, OTP)
5. User registration and login flows

### Phase 2: Course Management
1. Category CRUD
2. Course CRUD
3. Course search and filtering
4. Review system
5. Course approval workflow

### Phase 3: Shopping & Orders
1. Shopping cart functionality
2. Address management
3. Order creation
4. Payment integration
5. Order tracking

### Phase 4: Delivery System
1. Delivery profile management
2. Order assignment system
3. Delivery acceptance/rejection
4. Delivery tracking
5. Earnings calculation

### Phase 5: Admin Features
1. Admin dashboard
2. User management
3. Course management
4. Order management
5. Analytics

### Phase 6: Additional Features
1. Notification system
2. Enrollment system
3. Advanced search
4. File uploads
5. Real-time features

---

## Notes & Considerations

1. **Physical vs Digital Products**: The app combines course (digital) delivery with physical product delivery. Ensure the system can handle both types of orders.

2. **Instructor Role**: Consider if instructors are separate users or if any user can become an instructor. The current design suggests instructors might be a separate role.

3. **Course Content**: Decide how course content (lessons) are stored - as text, video URLs, or actual file uploads. Consider using a separate content delivery network (CDN) for videos.

4. **Payment Methods**: Implement at least one payment method initially (e.g., Cash on Delivery) and add others later (Stripe, PayPal).

5. **Delivery Earnings**: Define the earnings calculation formula (percentage of order, fixed fee, distance-based, etc.).

6. **Order Numbering**: Implement a unique order numbering system (e.g., ORD-20240115-0001).

7. **Rating System**: Implement rating calculation (average of all reviews) and update it when new reviews are added.

8. **Course Status**: Consider the course approval workflow - courses might be in DRAFT, PENDING, PUBLISHED, or REJECTED status.

9. **Location Services**: If implementing real-time tracking, consider using WebSockets or Server-Sent Events (SSE).

10. **Multi-language Support**: If the app supports multiple languages, consider internationalization (i18n) from the start.

11. **Wholesale Pricing**: Implement tiered pricing system where wholesale customers get discounts based on their tier and order quantity.

12. **Excel Import Validation**: Validate Excel imports thoroughly - check SKU uniqueness, price formats, required fields, etc.

13. **Product Stock Management**: Implement real-time stock updates when orders are placed/completed/cancelled. Consider low stock alerts.

14. **Report Generation**: Reports can be resource-intensive. Consider queue system (Bull/BullMQ) for async report generation.

15. **Permission System**: Design permissions at resource-action level (e.g., "product:create", "order:update", "user:delete") for granular control.

16. **Doctor Verification**: Implement a workflow for doctor/instructor verification including document upload and admin approval.

17. **Mixed Orders**: Handle orders containing both courses and products appropriately - courses don't need delivery, products do.

---

## Summary of New Features Added

### New Database Tables Added:
1. **Student** - Separate table for student-specific data
2. **Doctor** - Separate table for doctor/instructor management
3. **Product** - Product catalog with wholesale/retail pricing
4. **ProductImage** - Product image gallery
5. **ProductReview** - Product reviews and ratings
6. **ProductImportLog** - Track Excel import history
7. **WholesaleCustomer** - Wholesale customer management
8. **Role** - Role definitions
9. **Permission** - Permission definitions
10. **RolePermission** - Role-Permission mapping
11. **UserRolePermission** - User-Role assignment
12. **Report** - Generated reports tracking

### Enhanced Existing Tables:
1. **User** - Added relations to new tables, added WHOLESALE_CUSTOMER, DOCTOR roles
2. **Category** - Added type (COURSE/PRODUCT), parent-child hierarchy
3. **Order** - Added orderType, wholesale fields, enhanced pricing fields
4. **OrderItem** - Now supports both courses and products
5. **CartItem** - Now supports both courses and products

### New Features:
- ✅ Wholesale/Retail product selling (WooCommerce-like)
- ✅ Excel import/export for products
- ✅ Comprehensive reporting system
- ✅ Role-Based Access Control (RBAC) with granular permissions
- ✅ Separate Student table
- ✅ Separate Doctor/Instructor table
- ✅ Product inventory management
- ✅ Product reviews and ratings
- ✅ Wholesale customer management
- ✅ Report generation in multiple formats (PDF, Excel, CSV)

### Total API Endpoints: 200+ endpoints covering all features

---

This comprehensive prompt provides everything needed to build the backend for the Studify application using Node.js, Prisma, and MySQL, including both educational and e-commerce functionality.

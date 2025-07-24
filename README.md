# Educational Notes Platform

A comprehensive educational notes platform built with React and Supabase, featuring user authentication, content management, and admin controls.

## Features

- **Magic Link Authentication**: Passwordless login using Supabase Auth
- **User Access Control**: Admin approval system for new users
- **Content Management**: Organize notes (PDFs) and videos by subjects
- **Admin Panel**: Comprehensive admin interface for user and content management
- **File Storage**: Secure PDF storage using Supabase Storage
- **Responsive Design**: Mobile-first responsive design
- **Row Level Security**: Secure data access with Supabase RLS

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Go to Project Settings > API and copy your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

1. In your Supabase dashboard, go to SQL Editor
2. Run the migration script from `supabase/migrations/create_initial_schema.sql`
3. This will create all necessary tables, policies, and sample data

### 3. Storage Setup

1. In Supabase dashboard, go to Storage
2. Create a new bucket named `pdfs`
3. Set the bucket to public
4. Configure appropriate RLS policies for the bucket

### 4. Authentication Setup

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Disable email confirmation if desired for easier testing
4. Configure email templates as needed

### 5. Admin User Setup

After the first user signs up, you'll need to manually set them as an admin:

1. Go to Supabase dashboard > Table Editor > users table
2. Find your user record and set `is_admin` to `true`
3. Set `access` to `true` to give yourself access

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   ├── Dashboard.tsx    # Main user dashboard
│   ├── Layout.tsx       # Common layout wrapper
│   ├── Login.tsx        # Authentication component
│   └── ProtectedRoute.tsx # Route protection
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   └── supabase.ts     # Supabase client and types
└── App.tsx             # Main application component
```

## User Roles

### Regular Users
- Can view subjects, notes, and videos (after admin approval)
- Access is controlled by the `access` field in the users table

### Admin Users
- Full access to admin panel
- Can manage users (grant/revoke access, promote to admin)
- Can manage subjects (create, edit, delete)
- Can manage content (upload PDFs, add YouTube videos)

## Security Features

- Row Level Security (RLS) on all database tables
- File upload validation (PDFs only)
- Admin route protection
- Secure file storage with Supabase Storage
- Magic link authentication (no passwords to compromise)

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your preferred hosting platform
3. Update your Supabase site URL settings to match your production domain
4. Ensure environment variables are properly configured in your hosting platform

## API Endpoints

The application uses Supabase's built-in APIs:
- Authentication: Handled by Supabase Auth
- Database: Direct queries using Supabase client
- Storage: File uploads using Supabase Storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
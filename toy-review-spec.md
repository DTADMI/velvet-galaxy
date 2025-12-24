# Adult Toy Review Platform - Technical Specification

## 1. Project Overview

A comprehensive web application for reviewing adult toys, featuring user authentication, media-rich content, and
community engagement features.

## 2. Technical Stack

### Core Technologies

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Search**: MeiliSearch
- **Styling**: Tailwind CSS + shadcn/ui
- **3D Models**: Three.js + React Three Fiber
- **Video Handling**: Mux
- **Analytics**: Plausible (privacy-focused)
- **Payments**: Stripe (for donations)
- **Hosting**: Vercel (Frontend + Serverless Functions)
- **Storage**: Cloudinary (for media)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry

## 3. Application Architecture

### Monolithic Architecture

- Single codebase with clear separation of concerns
- API routes co-located with frontend components
- Server Components for better performance
- Edge caching for static content

### Key Directories

```
/app
  /(public)         # Public routes
  /(auth)           # Authentication routes
  /toys             # Toy catalog
    /[id]           # Individual toy pages
  /api              # API routes
  /admin            # Admin dashboard
/components         # Shared UI components
/lib                # Utilities and helpers
/prisma             # Database schema and migrations
/public             # Static assets
/scripts            # Database and utility scripts
/translations       # i18n files
```

## 4. Database Design

### PostgreSQL Tables

1. **users** - User accounts and profiles
2. **toys** - Toy information
3. **reviews** - User reviews
4. **comments** - Comments on reviews
5. **likes** - Likes on reviews
6. **tags** - Categorization tags
7. **media** - Media files
8. **donations** - Support transactions

## 5. API Design

### RESTful Endpoints

- `GET /api/toys` - List toys with filters
- `GET /api/toys/[id]` - Get toy details
- `POST /api/reviews` - Create review
- `GET /api/comments?toyId=` - Get comments
- `POST /api/comments` - Create comment
- `POST /api/likes` - Toggle like
- `GET /api/search` - Global search

## 6. Frontend Architecture

### Key Features

- Server-side rendering (SSR) for SEO
- Static generation for product pages
- Client-side navigation
- Optimistic UI updates
- Responsive design
- Lazy loading for media

### Component Structure

- **Layout** - App shell and navigation
- **ToyCard** - Toy preview in listings
- **ToyDetail** - Full toy page
- **ReviewForm** - Review submission
- **CommentSection** - Comments display
- **MediaGallery** - Image/3D viewer
- **Search** - Global search interface

## 7. Authentication & Authorization

### Authentication Flow

- Email/Password + OAuth (Google, Twitter)
- JWT-based sessions
- Role-based access control (User, Admin)
- Protected API routes
- Rate limiting

## 8. Media Handling

### Storage Strategy

- Images: WebP format with responsive variants
- 3D Models: glTF format
- Videos: Streamed via Mux
- CDN delivery with Cloudinary

## 9. Search Implementation

### MeiliSearch Integration

- Full-text search
- Faceted search by categories
- Typo tolerance
- Synonyms support
- Instant search results

## 10. Internationalization (i18n)

- Next.js i18n routing
- JSON translation files
- RTL support
- Language switcher
- Localized dates/numbers

## 11. Theming & Styling

### Design System

- Dark/light theme
- Custom color palette
- Responsive typography
- Animation system
- Component variants

## 12. Accessibility (a11y)

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Reduced motion
- Color contrast

## 13. Performance Optimization

- Image optimization
- Code splitting
- Route prefetching
- Edge caching
- Bundle analysis

## 14. Security Considerations

- CSRF protection
- XSS prevention
- Rate limiting
- Input validation
- Secure headers
- Regular dependency updates

## 15. Deployment Strategy

### Vercel Setup

- Preview deployments
- Edge caching
- Serverless functions
- Environment variables
- Custom domains

## 16. CI/CD Pipeline

### GitHub Actions Workflow

1. Linting
2. Type checking
3. Unit tests
4. E2E tests
5. Build
6. Deploy to staging/prod

## 17. Monitoring & Analytics

- Error tracking (Sentry)
- Performance monitoring
- Real user metrics
- Uptime monitoring
- Custom events

## 18. Future Enhancements

- User profiles
- Social sharing
- Wishlists
- Comparison tool
- AR/VR preview
- Community forums
- Affiliate program
- Advanced analytics
- Mobile app

## Implementation Notes

- Start with MVP features
- Implement analytics early
- Monitor performance
- Gather user feedback
- Regular security audits

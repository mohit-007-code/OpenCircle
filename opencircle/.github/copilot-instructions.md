# OpenCircle Project AI Assistant Instructions

## Project Overview
OpenCircle is a Django-based social platform that allows users to create and join communities, share posts, and interact with other users. The project follows a modular Django architecture with distinct apps for different functionalities.

## Project Structure
- `accounts/`: User authentication and profile management
- `communities/`: Community creation and management 
- `posts/`: Post creation and management within communities
- `home/`: Main landing page and common views
- `static/`: Global static assets (CSS/JS)
- `templates/`: Global templates and base layouts
- `media/`: User uploaded content

## Key Architecture Patterns

### Authentication and User Model
- Custom user model defined in `accounts/models.py`
- User authentication handled through Django's built-in auth system
- User profiles with profile pictures stored in `media/profile_pics/`

### Community Management
- Communities can have creators and members (M2M relationship)
- Creators have special privileges (edit/delete)
- Members can create posts and leave communities
- Search functionality implemented for finding communities

### View Structure
- Class-based views for CRUD operations
- Function-based views for specific actions
- Templates organized by app with shared base templates

## Common Development Workflows

### Template Pattern
Each app follows a structure of:
```
app_name/
  templates/
    app_name/
      action_name.html
```

### URL Naming Convention
- URLs follow pattern: `action-model` (e.g., `create-community`, `edit-post`)
- App-specific URLs in `app_name/urls.py`
- All URLs included in main `opencircle/urls.py`

### Static Files
- JavaScript in `static/js/main.js`
- CSS in `static/css/style.css`
- Bootstrap 5 for base styling
- Bootstrap Icons for icons

### AJAX Patterns
- Search functionality uses AJAX for dynamic updates
- JSON responses for API-like endpoints
- CSRF token included in AJAX requests

## Key Integration Points
1. User Authentication integrates with all protected views
2. Communities integrate with Posts system
3. Static files served through Django in development
4. Media files for user uploads

## Project-Specific Conventions
1. Community creators cannot leave their communities
2. Users must be authenticated to join communities
3. Search implemented with case-insensitive lookups
4. Bootstrap used for responsive design

## Testing Notes
- Django's test framework used
- Tests organized per app
- Authentication required for most views

## Common Debugging Tips
1. Check Django debug toolbar for query optimization
2. Use print statements in views for tracking flow
3. Browser console for JavaScript issues
4. Django admin interface for data inspection
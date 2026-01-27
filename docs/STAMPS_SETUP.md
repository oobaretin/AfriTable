# Stamps Feature Setup Guide

This document explains how to set up the "Stamps" feature, which allows users to share photos and reviews from their dining experiences.

## Overview

The Stamps feature enables users to:
1. Upload photos from past reservations
2. Add optional review text
3. Share their "stamp" to a community feed
4. View other users' stamps on the homepage

## Database Setup

### 1. Run the Migration

Apply the migration file to create the `stamps` table:

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply manually in Supabase Dashboard SQL Editor
# Copy contents of: supabase/migrations/032_stamps_table.sql
```

### 2. Verify Table Creation

The migration creates:
- `stamps` table with columns: `id`, `user_id`, `reservation_id`, `restaurant_id`, `photo_url`, `review_text`, `created_at`, `updated_at`
- Indexes for performance
- RLS policies for security (public read, authenticated write)

## Storage Setup

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `stamp-photos`
4. Settings:
   - **Public bucket**: ✅ Yes (so photos can be displayed)
   - **File size limit**: 10MB (or your preference)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### Storage Policies

The bucket needs policies for authenticated uploads:

```sql
-- Allow authenticated users to upload
CREATE POLICY "stamp-photos-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stamp-photos');

-- Allow public read access
CREATE POLICY "stamp-photos-public-read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stamp-photos');
```

## Testing

1. **Create a reservation** (or use existing past reservation)
2. **Go to Diner Dashboard** (`/diner-dashboard`)
3. **Find a past reservation** in "Past Stamps (History)"
4. **Click "Upload Photo"** button
5. **Upload a photo** and optionally add review text
6. **Verify** the stamp appears in the Community Feed on homepage

## API Endpoints

### POST `/api/user/stamps`
Upload a new stamp (requires authentication)

**Form Data:**
- `photo`: File (image)
- `reservationId`: string
- `reviewText`: string (optional)

**Response:**
```json
{
  "ok": true,
  "stamp": {
    "id": "...",
    "photo_url": "...",
    "restaurant": { ... }
  }
}
```

### GET `/api/stamps?limit=20`
Fetch stamps for community feed (public)

**Response:**
```json
{
  "stamps": [
    {
      "id": "...",
      "photoUrl": "...",
      "reviewText": "...",
      "restaurant": { ... },
      "userName": "..."
    }
  ]
}
```

## Components

- **`ShareStamp`**: Displays a single stamp card with photo, restaurant info, and review
- **`PhotoUploadDialog`**: Modal dialog for uploading photos from past reservations
- **`CommunityFeed`**: Homepage section displaying recent stamps in a grid

## Notes

- Photos are stored in Supabase Storage under `stamps/{user_id}/{uuid}.{ext}`
- Stamps are linked to reservations, so users can only create stamps for their own past reservations
- The community feed shows the 6 most recent stamps by default
- RLS policies ensure users can only modify their own stamps

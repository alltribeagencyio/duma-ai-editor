# Upload Edited Image to Supabase Storage (n8n Node)

This guide shows how to upload an edited image to Supabase Storage from within your n8n workflow loop.

## Overview

After each image is edited in the loop:
1. Upload the edited image to Supabase "edited-images" bucket
2. Get the public URL
3. Store the URL for later use
4. Continue to next image

## Required Credentials

Add these to your n8n credentials or environment variables:

```
SUPABASE_URL: https://hmtizgdzkueakwextuml.supabase.co
SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA
```

> ⚠️ Use SERVICE_ROLE_KEY (not ANON_KEY) to bypass RLS policies for uploads

## Folder Structure

Upload images to: `{userId}/{jobId}/{filename}`

Example: `5e7afc5e-4697-44ea-87cf-00c8fb01e54a/324267d5-7c5f-49b1-840a-2363041624e0/edited-image-1.png`

## n8n Node Configuration

### Node Type: HTTP Request

**Method:** `POST`

**URL:**
```
https://hmtizgdzkueakwextuml.supabase.co/storage/v1/object/edited-images/{{ $json.userId }}/{{ $json.jobId }}/edited-{{ $json.originalFilename }}
```

**Authentication:**
- Type: Header Auth
- Name: `Authorization`
- Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA`

**Headers:**
```
Content-Type: image/png
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA
```

**Body:**
- Send Binary Data: Yes
- Binary Property: `data` (or whatever property contains your edited image binary data)

**Response:**
```json
{
  "Key": "edited-images/5e7afc5e.../edited-image-1.png"
}
```

## Get Public URL

After upload succeeds, construct the public URL:

```javascript
// In a Function node
const uploadedPath = $json.Key; // from upload response
const publicUrl = `https://hmtizgdzkueakwextuml.supabase.co/storage/v1/object/public/${uploadedPath}`;

return {
  json: {
    ...items[0].json,
    editedImageUrl: publicUrl
  }
};
```

## Complete Workflow Structure

```
1. Webhook Trigger (receives jobId, userId, imageUrls, prompt)
2. Loop Over Each imageUrl
   ├─ 3. Download Original Image
   ├─ 4. Edit Image (your AI processing)
   ├─ 5. Upload to Supabase Storage ← THIS NODE
   ├─ 6. Function: Construct Public URL
   └─ 7. Store URL in array
8. After Loop: Combine all URLs
9. HTTP Request: Send callback to app
```

## Alternative: Using n8n Code Node

If you prefer using a Code node with JavaScript:

```javascript
const https = require('https');
const fs = require('fs');

const userId = $json.userId;
const jobId = $json.jobId;
const filename = `edited-${Date.now()}.png`;
const imageBuffer = $binary.data; // Your edited image binary

const options = {
  hostname: 'hmtizgdzkueakwextuml.supabase.co',
  port: 443,
  path: `/storage/v1/object/edited-images/${userId}/${jobId}/${filename}`,
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdGl6Z2R6a3VlYWt3ZXh0dW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODM3MywiZXhwIjoyMDgxNjA0MzczfQ.XFk3RhJbCr9MeGbslezTNrUd3qbTakUqvvxj-OLPTiA',
    'Content-Type': 'image/png',
    'Content-Length': imageBuffer.length
  }
};

// Upload and return public URL
return new Promise((resolve, reject) => {
  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      const publicUrl = `https://hmtizgdzkueakwextuml.supabase.co/storage/v1/object/public/edited-images/${userId}/${jobId}/${filename}`;
      resolve([{
        json: {
          ...item.json,
          editedImageUrl: publicUrl
        }
      }]);
    } else {
      reject(new Error(`Upload failed: ${res.statusCode}`));
    }
  });

  req.write(imageBuffer);
  req.end();
});
```

## Storing URLs for Callback

After each image upload, collect the URLs. Use one of these methods:

### Method 1: Set Node (Append)
After getting the public URL, use a Set node to add it to an array:
```
editedImageUrls.push($json.editedImageUrl)
```

### Method 2: Function Node
```javascript
// Initialize array if first iteration
if (!$workflow.staticData.editedUrls) {
  $workflow.staticData.editedUrls = [];
}

// Add current URL
$workflow.staticData.editedUrls.push($json.editedImageUrl);

return {
  json: {
    editedImageUrl: $json.editedImageUrl,
    totalProcessed: $workflow.staticData.editedUrls.length
  }
};
```

## Final Callback Node

After loop completes, send callback to app:

**HTTP Request Node:**
- Method: POST
- URL: `http://localhost:3000/api/webhook/callback` (use the callbackUrl from initial webhook)
- Body:
```json
{
  "jobId": "{{ $json.jobId }}",
  "status": "completed",
  "outputImages": {{ $workflow.staticData.editedUrls }}
}
```

## Testing

1. Test upload with a single image first
2. Check Supabase Storage UI to verify file appears
3. Test the public URL in browser
4. Verify app receives callback correctly

## Troubleshooting

**401 Unauthorized:** Check SERVICE_ROLE_KEY is correct
**403 Forbidden:** Verify bucket policies allow public read
**404 Not Found:** Check bucket name is "edited-images" (not "edited_images")
**413 Payload Too Large:** Check image size (max 50MB by default)

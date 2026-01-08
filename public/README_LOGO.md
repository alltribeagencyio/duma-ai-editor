# Adding Your Duma Logo

## Quick Steps

1. **Save your logo image** to this folder (`public/`)

2. **Name it** one of the following:
   - `duma-logo.png` (if PNG format)
   - `duma-logo.jpg` (if JPG format)
   - `duma-logo.svg` (if SVG format) - **RECOMMENDED for best quality**

3. **Update the image path** if you use a different name:
   - Open: `components/layout/Sidebar.tsx`
   - Find: `src="/duma-logo.svg"`
   - Change to: `src="/your-logo-name.png"` (or `.jpg`)

## Current Setup

The sidebar is configured to show:
- **Full sidebar**: Logo (48x48px) + "DUMA" text + "AI Image Editor" subtitle
- **Collapsed sidebar**: Just the logo (40x40px)

## Supported Formats

✅ **SVG** - Best for logos (scales perfectly, small file size)
✅ **PNG** - Good for logos with transparency
✅ **JPG** - Works but no transparency

## Logo Requirements

- **Recommended size**: At least 200x200px
- **Aspect ratio**: Square (1:1) works best
- **Background**: Transparent (PNG/SVG) or white
- **File size**: Under 100KB for fast loading

## Example

If your logo file is called `my-custom-logo.png`:

1. Put it in this `public/` folder
2. It will be accessible at `/my-custom-logo.png`
3. Update Sidebar.tsx:

```tsx
<Image
  src="/my-custom-logo.png"  // Changed from /duma-logo.svg
  alt="Duma Logo"
  width={48}
  height={48}
  className="object-contain"
  priority
/>
```

## Current Placeholder

I've created a placeholder SVG (`duma-logo.svg`) that shows:
- Lion character with hat
- Safari/detective style
- Orange and brown colors
- "DUMA" text included

**Replace it with your actual logo!**

## Testing

After adding your logo:
1. Restart the development server: `npm run dev`
2. Hard refresh the browser: `Ctrl+Shift+R`
3. Check the sidebar - your logo should appear!

## Troubleshooting

### Logo not showing?
- Check the file name matches exactly (case-sensitive on Linux)
- Verify the file is in the `public/` folder
- Check browser console (F12) for errors
- Make sure Next.js server restarted

### Logo looks blurry?
- Use a higher resolution image (at least 200x200px)
- SVG format will always look sharp
- Use 2x size for retina displays (e.g., 96x96px for 48x48 display)

### Logo has wrong colors?
- Check if it's an SVG with embedded styles
- Try PNG with transparency instead
- Edit the SVG in a text editor to change colors

## Need Help?

The logo appears in these files:
- `components/layout/Sidebar.tsx` - Main sidebar logo
- `public/duma-logo.svg` - Placeholder logo file

Update these to use your actual branding!

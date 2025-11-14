# How to Add Preview Images to Problem Cards

## Quick Guide

### 1. **Create the previews folder**
Create a folder in your `public` directory:
```
rosetta-hub/public/previews/
```

### 2. **Add your preview image**
Save your screenshot/preview image in that folder:
```
rosetta-hub/public/previews/binary-search.webp
```

**Recommended image specs:**
- **Format**: WebP (best) > PNG > JPG
- **Size**: 1200x800px (3:2 ratio)
- **File size**: < 100KB (IMPORTANT!)
- **Why?** With 100 problems: 100KB × 100 = 10MB total

### 3. **Optimize your image** (CRITICAL!)

Use [Squoosh](https://squoosh.app/):
1. Upload your screenshot
2. Choose WebP format
3. Set quality to 75-80
4. Download (should be < 100KB)

### 4. **Update the problem meta file**
Edit the problem's `meta.ts` file:

```typescript
// rosetta-hub/src/problems/binary-search/meta.ts
export const meta: ProblemMeta = {
  title: 'Binary Search',
  slug: 'binary-search',
  difficulty: 'easy',
  tags: ['algorithm', 'array', 'sorting'],
  description: '...',
  createdAt: '2025-11-14',
  previewImage: '/previews/binary-search.webp', // ← Add this line
};
```

### 5. **That's it!**
The preview will automatically show:
- Lazy loaded (only when scrolled into view)
- `object-contain` (no cropping/zooming)
- Subtle background effect on card
- Full preview on hover tooltip

## Performance Optimizations (Already Implemented)

✅ **Lazy Loading**: Images only load when visible  
✅ **Object-contain**: Shows full image without cropping  
✅ **Reduced opacity**: 20-40% for subtle effect  
✅ **Delayed tooltip**: 300ms delay prevents accidental loads  

**Result**: With 100 problems, only ~10-20 images load initially (~1-2MB), not all 100!

## Tips for Great Preview Images

### Option 1: Screenshot Your Visualization (Recommended)
1. Open your visualization page
2. Run it to an interesting state
3. Take a screenshot (1200x800px)
4. Optimize with Squoosh (WebP, quality 75-80)
5. Save as `{slug}.webp`

### Option 2: Create a Thumbnail
1. Use Figma/Photoshop to create a custom thumbnail
2. Show the key concept (e.g., array with pointers)
3. Use your app's color scheme (cyan/blue tones)
4. Keep it simple and recognizable
5. Export as WebP

### Optimization Tools

**Online (Easiest)**
- [Squoosh](https://squoosh.app/) - Best all-around
- [TinyPNG](https://tinypng.com/) - PNG compression

**Command Line**
```bash
# Convert to WebP
npx @squoosh/cli --webp auto input.png -d public/previews

# Or with ImageMagick
convert input.png -resize 1200x800 -quality 80 output.webp
```

## Example Structure

```
rosetta-hub/
├── public/
│   └── previews/
│       ├── binary-search.webp    (< 100KB)
│       ├── 100-doors.webp        (< 100KB)
│       ├── fizz-buzz.webp        (< 100KB)
│       └── ...
└── src/
    └── problems/
        ├── binary-search/
        │   └── meta.ts  ← previewImage: '/previews/binary-search.webp'
        ├── 100-doors/
        │   └── meta.ts
        └── ...
```

## Troubleshooting

**Image looks zoomed in?**
- We now use `object-contain` (shows full image)
- Make sure your screenshot has some padding
- Capture the full visualization

**File size too large?**
- Use WebP format (30-50% smaller than PNG)
- Lower quality to 70-75
- Reduce dimensions to 1000x667

**Image not showing?**
- Check file path is correct
- Verify image exists in `public/previews/`
- Check browser console for errors
- Filename must match exactly (case-sensitive)

## No Image? No Problem!

If you don't add a `previewImage`, the card will still look great with:
- Glassmorphism effects
- Gradient borders
- Corner accents
- All other enhancements

The preview image is optional but highly recommended!

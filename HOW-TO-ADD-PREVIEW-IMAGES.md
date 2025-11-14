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
rosetta-hub/public/previews/binary-search.png
```

**Recommended image specs:**
- Format: PNG or WebP (for transparency)
- Size: 800x600px or 1200x900px
- Keep file size under 200KB for performance
- Use a screenshot of your visualization in action

### 3. **Update the problem meta file**
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
  previewImage: '/previews/binary-search.png', // ← Add this line
};
```

### 4. **That's it!**
The preview will automatically show on the card with:
- 10% opacity normally
- 20% opacity on hover
- Subtle fade transition

## Tips for Great Preview Images

### Option 1: Screenshot Your Visualization
1. Open your visualization page
2. Take a screenshot of the most interesting state
3. Crop to focus on the visualization
4. Save as PNG

### Option 2: Create a Thumbnail
1. Use Figma/Photoshop to create a custom thumbnail
2. Show the key concept (e.g., array with pointers for binary search)
3. Use your app's color scheme (cyan/blue tones)
4. Keep it simple and recognizable

### Option 3: Animated Preview (Advanced)
1. Record a short GIF of your visualization
2. Convert to WebP for better performance
3. Keep it under 500KB

## Example Structure

```
rosetta-hub/
├── public/
│   └── previews/
│       ├── binary-search.png
│       ├── fizz-buzz.png
│       ├── hello-world.png
│       └── ...
└── src/
    └── problems/
        ├── binary-search/
        │   └── meta.ts  ← Add previewImage here
        ├── fizz-buzz/
        │   └── meta.ts
        └── ...
```

## No Image? No Problem!

If you don't add a `previewImage`, the card will still look great with:
- Glassmorphism effects
- Gradient borders
- Corner accents
- All other enhancements

The preview image is optional and enhances the card when available.

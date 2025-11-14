// Layout configuration constants

export const LAYOUT = {
  // Grid gaps
  gridGap: {
    mobile: 'gap-4',
    tablet: 'md:gap-6',
    desktop: 'lg:gap-8',
  },
  
  // Container padding
  containerPadding: {
    mobile: 'px-4',
    tablet: 'md:px-6',
    desktop: 'lg:px-8',
  },
  
  // Max width
  maxWidth: 'max-w-7xl',
  
  // Grid columns
  gridCols: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-3',
    wide: 'xl:grid-cols-4',
  },
} as const;

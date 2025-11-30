import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Arena Storage Pool',
  slug: 'arena-storage-pool',
  difficulty: 'medium',
  tags: ['data-structure', 'algorithm', 'simulation'],
  description: `Dynamically allocated objects take their memory from a heap. The memory for an object is provided by an allocator which maintains the storage pool used for the heap.

An arena is a pool in which objects are allocated individually, but freed by groups. This visualization demonstrates how arena allocators work - objects are allocated one by one into memory blocks, and when the arena is cleared, all objects are freed at once.

This is more efficient than freeing objects individually, making arenas ideal for temporary allocations with similar lifetimes.`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Arena_storage_pool',
  createdAt: '2025-11-30',
  previewImage: '/previews/arena-storage-pool.png',
};

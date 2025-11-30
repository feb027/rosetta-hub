import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Active Directory',
  slug: 'active-directory',
  difficulty: 'medium',
  tags: ['data-structure', 'search', 'simulation', 'string'],
  description: `Simulate connecting to an Active Directory (LDAP) server and searching for users.

Active Directory is Microsoft's directory service that stores information about network resources like users, computers, and groups in a hierarchical tree structure.

This visualization demonstrates:
• Establishing LDAP connections with authentication
• Searching users by various attributes (name, email, department)
• Understanding the hierarchical OU (Organizational Unit) structure
• LDAP filter syntax and query building`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Active_Directory/Connect',
  createdAt: '2025-11-30',
  previewImage: '/previews/active-directory.png',
};

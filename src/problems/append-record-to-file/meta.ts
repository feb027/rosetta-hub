import type { ProblemMeta } from '../../types/problem';

export const meta: ProblemMeta = {
  title: 'Append a Record to the End of a Text File',
  slug: 'append-record-to-file',
  difficulty: 'easy',
  tags: ['string', 'simulation', 'processing'],
  description: `Many systems offer the ability to open a file for writing, such that any data written will be appended to the end of the file. This feature is most useful in the case of log files, where many jobs may be appending to the log file at the same time.

The task is to demonstrate appending records to a passwd-style file. Given a two record sample, write these records out in the typical system format, close the file, then reopen and append a new record. Finally, open the file and demonstrate the new record has been written to the end.

The passwd file format uses colon-separated fields: account:password:UID:GID:fullname,office,extension,homephone,email:directory:shell`,
  rosettaCodeUrl: 'https://rosettacode.org/wiki/Append_a_record_to_the_end_of_a_text_file',
  createdAt: '2025-11-30',
  previewImage: '/previews/append-record-to-file.png',
};

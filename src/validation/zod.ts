import { z } from 'zod';

// הודעות שגיאה בעברית
z.config(z.locales.he());
z.config({
  customError: (issue) => (issue.input === undefined && issue.code === 'invalid_type' ? 'שדה חובה' : undefined),
});

export { z };

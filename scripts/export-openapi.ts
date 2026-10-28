// יוצר את הקובץ openapi.json משורש הפרויקט מתוך src/docs/openapi.ts
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { openApiDocument } from '../src/docs/openapi';

const target = path.join(__dirname, '..', 'openapi.json');
writeFileSync(target, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');
console.log(`נוצר ${target}`);

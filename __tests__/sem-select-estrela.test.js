import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Caminhos públicos e SSR leem colunas explícitas (nunca SELECT *).
const raiz = path.resolve(__dirname, '..');

function arquivos(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return arquivos(p);
        return /\.(js|jsx|ts|tsx)$/.test(e.name) ? [p] : [];
    });
}

describe('sem SELECT *', () => {
    it.each(['app', 'lib', 'components'])('%s/', (dir) => {
        const comEstrela = arquivos(path.join(raiz, dir))
            .filter((p) => /SELECT\s+\*\s+FROM/i.test(fs.readFileSync(p, 'utf8')))
            .map((p) => path.relative(raiz, p));
        expect(comEstrela).toEqual([]);
    });
});

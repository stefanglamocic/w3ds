import { Obj } from "../object/obj.js";

export class Utility {
    static async readFile(file: string) {
        return fetch(file)
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error("can't read file: " + file);
            });
    }

    static async loadImage(file: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = file;
            img.onload = () => {
                resolve(img);
            };
            img.onerror = reject;
        });
    }

    static parseObj(source: string) {
        const result = new Obj();

        const keywordRE = /(vn?t?|f)(?: )(.*)/;
        const lines = source.split('\n');

        for (let l of lines) {
            const line = l.trim();
            if (line.startsWith('#') || line === '')
                continue;

            const match = keywordRE.exec(line);
            if (!match)
                continue;

            const keyword = match[1]!;

            const parts = match[2]!.split(/\s+/);
            let splitParts = parts.map(p => { 
                const [a, b, c] =
                p.split('/')
                    .map(n => n === '' ? null : Number(n));
                return [a, b, c] as [number, number | null, number];
                });

            splitParts = this.generateTriangles(splitParts);
            
            if (keyword === 'f')
                result[keyword].push(...splitParts);
            else
                result[keyword].push(...parts.splice(0, 3).map(n => Number(n)));
        }

        return result;
    }

    private static generateTriangles(indices: [number, number | null, number][]) {
        if (indices.length === 3)
            return indices;

        let triangles: [number, number | null, number][] = [];
        for (let i = 1; i < indices.length - 1; ++i) {
            triangles.push(indices[0]!, indices[i]!, indices[i + 1]!);
        }

        return triangles;
    }
}
import { defaultPosition, type Position } from "../object/position.js";
import type { Renderable } from "../object/renderable.js";
import type { Renderer } from "./renderer.js";

const buildingTexFile = 'res/textures/colormap.png';
const vehicleTexFile = 'res/textures/colormap2.png';
const commercialTexFile = 'res/textures/colormap3.png'
const peopleTex = 'res/textures/colormap4.png'

const buildingAFile = 'res/models/building-type-a.obj';
const buildingDFile = 'res/models/building-type-d.obj';
const treeLFile = 'res/models/tree-large.obj';
const treeSFile = 'res/models/tree-small.obj';
const sedanFile = 'res/models/sedan.obj';
const fenceFile = 'res/models/fence.obj';
const buildingK = 'res/models/building-k.obj';
const buildingL = 'res/models/building-l.obj';
const fence1x3 = 'res/models/fence-1x3.obj';
const buildingQ = 'res/models/building-type-q.obj';
const buildingG = 'res/models/building-g.obj';
const buildingJ = 'res/models/building-j.obj';
const buildingE = 'res/models/building-e.obj';
const buildingM = 'res/models/building-m.obj';
const buildingH = 'res/models/building-h.obj';
const planter = 'res/models/planter.obj';
const ambulance = 'res/models/ambulance.obj';
const delivery = 'res/models/delivery.obj';
const deliveryFlat = 'res/models/delivery-flat.obj';
const suv = 'res/models/suv.obj';
const suvLux = 'res/models/suv-luxury.obj';
const taxi = 'res/models/taxi.obj';
const truck = 'res/models/truck.obj';
const truckFlat = 'res/models/truck-flat.obj';
const van = 'res/models/van.obj';

const femaleF = 'res/models/character-female-f.obj';
const femaleB = 'res/models/character-female-b.obj';
const femaleC = 'res/models/character-female-c.obj';
const femaleE = 'res/models/character-female-e.obj';
const maleA = 'res/models/character-male-a.obj';
const maleB = 'res/models/character-male-b.obj';
const maleC = 'res/models/character-male-c.obj';
const maleD = 'res/models/character-male-d.obj';

export class CustomScene {
    private static instance: CustomScene | null = null;

    private constructor(private renderer: Renderer) { }

    static load(renderer: Renderer) {
        if (!this.instance)
            this.instance = new CustomScene(renderer);

        this.suburbanScene();
    }

    private static loadObj(file: string, tex: string) {
        return this.instance?.renderer.loadRegularModel(file)
            .then(r => {
                this.instance?.renderer
                    .loadTexture(tex, r.getProgram())
                    .then(t => r.setTexture(t));

                return r;
            });
    }

    private static modifyObj(r: Renderable, pos: Position, s: number) {
        const scale = { x: s, y: s, z: s };
        r.move(pos);
        r.setScale(scale);
    }

    private static suburbanScene() {
        const objects = [
            {
                file: buildingAFile,
                tex: buildingTexFile,
                pos: {x: -2, z: 0.45},
                scale: 2
            },
            {
                file: buildingDFile,
                tex: buildingTexFile,
                pos: {x: -5.9, z: 2.55, theta: -181},
                scale: 2
            },
            {
                file: sedanFile,
                tex: vehicleTexFile,
                pos: {x: -0.25, z: 0.6},
                scale: 0.4
            },
            {
                file: treeLFile,
                tex: buildingTexFile,
                pos: {x: -3.05, z: 2.7},
                scale: 2
            },
            {
                file: treeLFile,
                tex: buildingTexFile,
                pos: {x: -3.65, z: 2.4},
                scale: 2
            },
            {
                file: treeSFile,
                tex: buildingTexFile,
                pos: {x: -3.5, z: 3.15},
                scale: 2
            },
            {
                file: fenceFile,
                tex: buildingTexFile,
                pos: {x: 0.3, z: 0.6, theta: -90},
                scale: 2
            },
            {
                file: buildingK,
                tex: commercialTexFile,
                pos: {x: -4.05, z: -6, theta: -180},
                scale: 2
            },
            {
                file: buildingL,
                tex: commercialTexFile,
                pos: {x: 6.15, z: -8.7, theta: 90},
                scale: 2
            },
            {
                file: buildingQ,
                tex: buildingTexFile,
                pos: {x: 5.85, z: -0.6},
                scale: 2
            },
            {
                file: fence1x3,
                tex: buildingTexFile,
                pos: {x: 4.2, z: -0.6, theta: -90},
                scale: 2
            },
            {
                file: buildingG,
                tex: commercialTexFile,
                pos: {x: -8.55, z: -6, theta: 180},
                scale: 2
            },
            {
                file: buildingJ,
                tex: commercialTexFile,
                pos: {x: 11.1, z: -12.3, theta: -180},
                scale: 2
            },
            {
                file: planter,
                tex: buildingTexFile,
                pos: {x: -1.35, z: -5.55, theta: -90},
                scale: 2
            },
            {
                file: buildingE,
                tex: commercialTexFile,
                pos: {x: 6.15, z: 4.35, theta: -270},
                scale: 2
            },
            {
                file: buildingM,
                tex: commercialTexFile,
                pos: {x: -7.65, z: -13.5},
                scale: 2
            },
            {
                file: buildingH,
                tex: commercialTexFile,
                pos: {x: -2.1, z: -9.9, theta: -90},
                scale: 2
            },
            {
                file: taxi,
                tex: vehicleTexFile,
                pos: {x: 2.7, theta: -180},
                scale: 0.4
            },
            {
                file: delivery,
                tex: vehicleTexFile,
                pos: {x: 2.7, z: 2.4, theta: 180},
                scale: 0.4
            },
            {
                file: ambulance,
                tex: vehicleTexFile,
                pos: {x: -4.95, z: -1.8, theta: 90},
                scale: 0.4
            },
            {
                file: suvLux,
                tex: vehicleTexFile,
                pos: {x: 0.9, z: -9.15},
                scale: 0.4
            },
            {
                file: sedanFile,
                tex: vehicleTexFile,
                pos: {x: 11.85, z: -9.6, theta: 180},
                scale: 0.4
            },
            {
                file: suv,
                tex: vehicleTexFile,
                pos: {x: 9.45, z: -9.75},
                scale: 0.4
            },
            {
                file: van,
                tex: vehicleTexFile,
                pos: {x: 0.75, z: -3, theta: 90},
                scale: 0.4
            },
            {
                file: deliveryFlat,
                tex: vehicleTexFile,
                pos: {x: 4.05, z: -5.1, theta: -126},
                scale: 0.4
            },
            {
                file: truck,
                tex: vehicleTexFile,
                pos: {x: 2.85, z: -11.1, theta: 180},
                scale: 0.4
            },
            {
                file: femaleE,
                tex: peopleTex,
                pos: {x: -4.35, z: -4.8, theta: 129.5},
                scale: 0.6
            },
            {
                file: maleB,
                tex: peopleTex,
                pos: {x: -2.40, z: 2.7, theta: -42},
                scale: 0.6
            },
            {
                file: maleC,
                tex: peopleTex,
                pos: {x: 6.75, z: -6.9, theta: 90},
                scale: 0.6
            },
            {
                file: femaleB,
                tex: peopleTex,
                pos: {x: -7.2, z: -6.3, theta: 35},
                scale: 0.6
            },
            {
                file: femaleC,
                tex: peopleTex,
                pos: {x: -6.75, z: -5.7, theta: -147},
                scale: 0.6
            },
            {
                file: maleD,
                tex: peopleTex,
                pos: {x: 5.55, z: 0.9, theta: -105},
                scale: 0.6
            },
            {
                file: maleA,
                tex: peopleTex,
                pos: {x: 10.95, z: -10.5, theta: -185.5},
                scale: 0.6
            },
            {
                file: femaleF,
                tex: peopleTex,
                pos: {x: 6.3, y: 1.65, z: -7.5},
                scale: 0.6
            }
        ];

        for (const o of objects) {
            this.loadObj(o.file, o.tex)
                ?.then(r => {
                    const p = defaultPosition();
                    Object.assign(p, o.pos);
                    this.modifyObj(r, p, o.scale);
                });
        }
    }
}
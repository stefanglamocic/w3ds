export type Position = {
    x: number,
    y: number,
    z: number,
    theta: number, //rotation around y axis
    phi: number    //rotation around x axis
};

export function createPosition(): Position {
    return {
        x: 0,
        y: 0,
        z: 0,
        theta: 0,
        phi: 0
    };
}
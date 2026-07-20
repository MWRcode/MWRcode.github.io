export const math = {
    randrange: function (a, b) {
        return Math.random() * (b - a) + a;
    },
    lerp: function (x, a, b) {
        return x * (b - a) + a;
    },
    getdist: function (xpos1, ypos1, xpos2, ypos2) {
        return Math.sqrt((xpos1 - xpos2) * (xpos1 - xpos2) + (ypos1 - ypos2) * (ypos1 - ypos2));
    },
    getsqrdist: function (xpos1, ypos1, xpos2, ypos2) {
        const xdiff = xpos1 - xpos2;
        const ydiff = ypos1 - ypos2;
        return xdiff * xdiff + ydiff * ydiff;
    },
    wrap: function (n, min, max) {
        if (min === undefined) {
            min = 0;
            max = 1;
        }
        const range = max - min;
        return ((((n - min) % range) + range) % range) + min;
    },
    pingpong: function (n, min, max) {
        if (min === undefined) {
            min = 0;
            max = 1;
        }
        const range = (max - min) * 2;
        const t = (((n - min) % range) + range) % range;
        return ((t < range / 2) ? t : range - t) + min;
    },
    clamp: function (x, a, b) {
        return Math.min(Math.max(x, a), b);
    },
    map: function (x, a, b) {
        return (x - a) / (b - a);
    }
};
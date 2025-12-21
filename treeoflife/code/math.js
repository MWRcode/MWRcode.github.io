export const math = {
    randrange: function(a, b) {
        return Math.random() * (b - a) + a;
    },
    lerp: function(x, a, b) {
        return x * (b - a) + a;
    },
    getdist: function(xpos1, ypos1, xpos2, ypos2) {
        return Math.sqrt((xpos1 - xpos2)*(xpos1 - xpos2) + (ypos1 - ypos2)*(ypos1 - ypos2));
    },
    getsqrdist: function(xpos1, ypos1, xpos2, ypos2) {
        return (xpos1 - xpos2)*(xpos1 - xpos2) + (ypos1 - ypos2)*(ypos1 - ypos2);
    },
    wrap: function(n, min, max) {
        const range = max - min;
        return ((((n - min) % range) + range) % range) + min;
    },
    pingpong: function(n, min, max) {
        const range = max - min;
        const t = n % (2 * range);
        return t < range ? min + t : max - (t - range);
    },
    clamp: function(x, a, b) {
        return Math.min(Math.max(x, a), b);
    },
    map: function(x, a, b) {
        return (x - a) / (b - a);
    }
};
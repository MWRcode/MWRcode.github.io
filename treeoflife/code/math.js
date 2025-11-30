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
        return (xpos1 - xpos2)*(xpos1 - xpos2) + (ypos1 - ypos2)*(ypos1 - ypos2); // faster to do subtractiuon twice than create a variable
    },
    clamp: function(x, a, b) {
        return Math.min(Math.max(x, a), b);
    },
    sat: function(x) {
        return Math.min(Math.max(x, 0.0), 1.0);
    },
    map: function(x, a, b) {
        return (x - a) / (b - a);
    }
};
const can = document.getElementById("Scattercanvas")
const draw =  can.getcontext("2d")
let yaw = 0;
let pitch =0;
let raw = 0;
let projection= "Perspective"

const yawsliders = document.getElementById("yaw")
const rollslider = document.getElementById("roll")
const pitchslider = document.getElementById("pitch")
const Autocheck = document.getElementById("autorotate")
const projection = document.getElementById("projectionselect")



yawsliders.oninput


function rollz(o,a){
    let c=Math.cos(a);
    let s=Math.sin(a);
    return{
        x:o.x*c - o.y*s,
        y:o.y*s + o.x*c,
        z:o.z
    };
}
function pitchX(o,a){
    let c=Math.cos(a);
    let s=Math.sin(a);
    return{
        x:o.x,
        y:o.y*c - o.z*s,
        z:o.y*s + o.z*c,
    };

}
function yawY(o,a){
    let c=Math.cos(a);
    let s=Math.sin(a);
    return{
        x:o.x*c - o.z*s,
        y:o.y,
        z:o.x*s + o.z*c,
    };

}

// The Cathedral of the Answer, up the pilgrim road from Lastlea: one long nave walked side-on, from the south door to the
// chancel in the north, where a seam of light stands in the wall above the altar. It is where the Lastmade was made, and
// where a soul is offered or kept. Warm stone, amber glass: the warmest place in the game, at first.
// Built in blocks like the Dark Stair (the floor runs straight across), with two low steps up to the chancel.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,box,cyl,ball}=K;
const WALL=42;
// the floor's height (game units) along the nave, south to north: two steps of 0.6 up to the chancel
const F=v=>v<-56||v>=54?WALL:v<36?2:v<38?2.6:3.2;
return {name:'The Cathedral of the Answer',walk:true,ry0:0,focus:[0,8,0],bg:[20,16,14],LD:[-0.4,0.75,-0.52],amb:[0.5,0.46,0.4],sun:[0.9,0.8,0.62],level:null,pv:[0.02,0.2,0.02],pcol:[255,230,170],pn:14,tile:[[150,140,124],[132,122,108],[70,62,56]],
// (how its mesh is made: see the Dark Stair's scene)
mesh:{block:true,amb:[0.62,0.56,0.5],deep:-16,fade:[0,-12],ground:{97:['flag',[1.25,1.12,0.95]],96:['flag',[1.45,1.25,0.95]],98:['brick',[0.8,0.74,0.66]]},walls:{97:['brick',[1.05,0.96,0.84]],96:['brick',[1.2,1.05,0.86]],98:['brick',[1.0,0.92,0.8]]},mats:{98:['n_plaster',[0.95,0.9,0.8]],4:['n_brick',[1.1,1.0,0.86]],5:['n_dark',[1.0,0.74,0.5]],34:['n_planks',[1.1,0.8,0.52]],36:['white',[0.06,0.05,0.05]],56:['white',[0.5,0.42,0.22]],31:['white',[1.95,1.85,1.55]],10:['white',[1.9,1.3,0.5]],11:['white',[1.9,0.9,0.3]]}},
foot:(x,z)=>Math.max(Math.abs(x-C+4)-12,Math.abs(z-C)-60),
h:(x,z)=>G0+(x-C<-11?WALL:F(z-C)),
bot:()=>0.4,
top:(sx,sy,sz)=>{const u=sx-C,v=sz-C;return u<-11||F(v)===WALL?98:v>=36?96:97;},
side:()=>98,
scatter:()=>{},init(){},
build(){const LT=this.lights=[];this.emit=[];const W=C-11;
// tall windows of amber glass between the piers, each with the light it lets in
for(let v=-42;v<=30;v+=12){const z=C+v;
box(W+0.12,G0+19,z,0.12,11,1.7,10);box(W+0.3,G0+19,z,0.14,11,0.14,36);box(W+0.3,G0+24,z,0.14,0.14,1.7,36);box(W+0.35,G0+7.4,z,0.5,0.4,2.3,4,0.05);
LT.push([W+3,G0+16,z,1.3,1,0.78,0.42]);}
for(let v=-48;v<=36;v+=12)box(W+0.45,G0+13,C+v,0.7,29,1.3,98,0.08);
box(W+0.3,G0+31.5,C,0.45,0.5,56,4,0.05);
// the south door, back out to the pilgrim road
{const z=C-51,y=G0+2;box(W+0.2,y+3.6,z,0.3,3.6,2.2,36);box(W+0.35,y+7.6,z,0.5,0.45,3.1,4,0.05);box(W+0.35,y+3.6,z-2.65,0.5,3.6,0.45,4,0.05);box(W+0.35,y+3.6,z+2.65,0.5,3.6,0.45,4,0.05);}
// pews, behind where one walks
for(let v=-40;v<=26;v+=4){box(C-6,G0+2.55,C+v,2.4,0.55,0.5,34,0.05);box(C-6,G0+3.5,C+v-0.45,2.4,0.5,0.12,34,0.03);}
// the lectern and its book
{const x=C-4,z=C+31,y=G0+2;cyl(x,z,y,y+2.6,0.3,0.25,5);box(x,y+2.85,z,0.7,0.12,0.9,34,0.03);box(x,y+3.05,z,0.5,0.08,0.7,98);}
// the chancel: the altar under its cloth, two candles, and the seam of light in the wall above, between its stone lips
{const x=C-5,z=C+46,y=G0+3.2;box(x,y+1.1,z,1.2,1.1,2.6,98,0.05);box(x,y+2.28,z,1.35,0.1,2.8,10);
for(const d of[-3.6,3.6]){cyl(x,z+d,y,y+3.2,0.16,0.12,56);ball(x,y+3.5,z+d,0.28,11);}
box(W+0.14,G0+20,z,0.14,14,0.32,31);box(W+0.3,G0+20,z-0.9,0.3,14.6,0.3,4,0.05);box(W+0.3,G0+20,z+0.9,0.3,14.6,0.3,4,0.05);
LT.push([W+2.5,G0+14,z,2.3,1,0.95,0.8]);LT.push([W+2.5,G0+26,z,1.6,1,0.95,0.8]);}
this.birds=null;this.ledges=[];
this.poi={nave:[0,-48],out:[-5,-51],verger:[-4.5,-43],book:[-4,31],altar:[-5,46,3.2]};}};
}

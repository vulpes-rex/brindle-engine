// The Dark Stair, under the bluff past the Underhall: a long gallery cut along a wall, walked side-on only, from the stair
// in the south to a balcony in the north. It is all climb: three pits to clear, a chasm crossed on two slabs that glide
// toward each other and apart, a lift to a gallery of planks that give way underfoot, a relic on a high block (the
// feather: a second jump in the air), and past it a shelf and a balcony that only two jumps reach.
// The floor runs straight across (the same height from the wall to the open side), so the hall is its own cross-section:
// a row of blocks. The slabs that move and the planks that fall are not built here; they are said in `ledges`, and the
// field draws them where they are at the moment.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,box,cyl,ball,ell,crag}=K;
const PIT=-15,WALL=42;
// the floor's height (game units) along the hall, south to north
const F=v=>v<-70||v>=72?WALL:v<-46?2:v<-43?PIT:v<-38?3.5:v<-34.5?PIT:v<-29.5?4.5:v<-25?PIT:v<-14?2:v<10?PIT:v<40?2:v<50?9.5:v<53?5.5:v<61?2:20;
return {name:'The Dark Stair',walk:true,ry0:0,focus:[0,8,0],bg:[7,8,16],LD:[-0.4,0.75,-0.52],amb:[0.3,0.33,0.46],sun:[0.5,0.55,0.75],level:null,pv:[0.02,0.3,0.02],pcol:[150,220,255],pn:10,tile:[[92,98,116],[78,84,102],[38,42,58]],
// how the mesh that stands in for the scene is made (tools: make-scene-mesh.py): in blocks, each cell flat with upright
// faces between, since this ground is masonry; lit dimly, by its torches; and what each of its grounds is tiled with
mesh:{block:true,amb:[0.36,0.4,0.56],deep:-16,fade:[-1,-13],ground:{97:['flag',[1,1,1]],98:['brick',[0.5,0.52,0.62]],3:['rock',[0.3,0.3,0.38]]},walls:{97:['brick',[0.92,0.92,1.02]],98:['brick',[0.66,0.68,0.82]],3:['rock',[0.3,0.3,0.38]]},mats:{98:['n_plaster',[0.7,0.72,0.86]],4:['n_brick',[0.7,0.7,0.84]],31:['white',[0.45,1.5,1.4]],5:['n_dark',[1.0,0.72,0.5]],34:['n_planks',[1.2,0.86,0.56]],36:['white',[0.05,0.05,0.09]],56:['white',[0.2,0.21,0.27]]}},
foot:(x,z)=>Math.max(Math.abs(x-C+3.5)-11.5,Math.abs(z-C)-76),
h:(x,z)=>G0+(x-C<-11?WALL:F(z-C)),
bot:()=>0.4,
top:(sx,sy,sz)=>{const u=sx-C,v=sz-C;return u<-11||F(v)===WALL?98:F(v)===PIT?3:97;},
side:()=>98,
scatter:()=>{},init(){},
build(){const LT=this.lights=[];this.emit=[];const W=C-11;
// torches along the wall, each at a height that suits what is walked past it
for(const[v,y]of[[-64,10],[-52,10],[-40,12],[-28,13],[-16,11],[-4,11],[8,11],[20,17],[32,17],[44,17.5],[56,25],[68,28]]){const z=C+v,Y=G0+y;
box(W+0.5,Y,z,0.5,0.18,0.18,56);cyl(W+1,z,Y-0.1,Y+0.9,0.28,0.62,56);ell(W+1,Y+1.6,z,0.5,0.95,0.5,11);ball(W+1,Y+1.25,z,0.42,10);LT.push([W+1.6,Y+1.5,z,1.5,1,0.62,0.3]);}
// piers between them, from the deep to the top, and two courses along the wall
for(let v=-58;v<=62;v+=12)box(W+0.45,G0+13,C+v,0.6,29,1.3,4,0.08);
box(W+0.3,G0+31,C,0.45,0.5,75,4,0.05);box(W+0.25,G0+22.5,C+65,0.35,0.3,7,4,0.05);
// the stair up, in the south: a dark arch in the wall with its frame and a step
{const z=C-66,y=G0+2;box(W+0.2,y+3.3,z,0.3,3.3,2,36);box(W+0.35,y+7,z,0.5,0.45,2.9,4,0.05);box(W+0.35,y+3.3,z-2.45,0.5,3.3,0.45,4,0.05);box(W+0.35,y+3.3,z+2.45,0.5,3.3,0.45,4,0.05);box(W+1.3,y+0.3,z,1.1,0.3,2,98,0.05);}
// the shelves that stay put: stone on beams out of the wall
const shelf=(z0,z1,y)=>{const zc=C+(z0+z1)/2,hz=(z1-z0)/2;box(C,G0+y-0.3,zc,2.5,0.3,hz,98,0.04);for(const d of[-hz+0.7,hz-0.7])box(C-6.6,G0+y-0.75,zc+d,4.6,0.16,0.2,56);};
shelf(21,25.5,9.5);shelf(53,59,16);
// the relic's stand on the high block: a stone with something bright on it
{const x=C-4,z=C+45,y=G0+9.5;cyl(x,z,y,y+0.5,1.3,1.1,98);cyl(x,z,y+0.5,y+2.3,0.7,0.55,98);cyl(x,z,y+2.3,y+2.6,0.95,0.95,4);ball(x,y+3.5,z,0.62,31);LT.push([x,y+4,z,0.9,0.35,0.95,0.9]);}
// the chest on the balcony, and the ring in its floor that leads back up
{const x=C-4,z=C+66,y=G0+20;box(x,y+0.75,z,0.95,0.75,1.4,34,0.05);box(x,y+1.65,z,1.05,0.22,1.5,5,0.08);box(x+0.98,y+1.05,z,0.06,0.3,0.25,31);}
{const x=C-4,z=C+70,y=G0+20;cyl(x,z,y,y+0.12,1.75,1.75,31);cyl(x,z,y,y+0.16,1.3,1.3,98);LT.push([x,y+2,z,0.6,0.35,0.95,0.9]);}
// fallen stone against the wall, where it is out of the way
for(const q of[[-60,2,1.3,3],[-19,2,1.1,5],[14,2,1.2,7],[57,2,1.4,2],[35,2,1.0,9]])crag(W+2.2,G0+q[1]+q[2]*0.3,C+q[0],q[2]*1.2,q[2],q[2]*1.1,3,q[3]);
// what was left behind by whoever worked this stair: a lamp niche cut low, a rope and a small harness, a sack of little oil
// flasks under a line of chalk, a tin cup by the relic, and two dead lamps on poles over the strongbox
{const z=C-58,y=G0+2;box(W+0.2,y+1.3,z,0.3,0.8,0.9,36);box(W+0.3,y+2.3,z,0.4,0.2,1.2,4,0.05);box(W+0.3,y+0.35,z,0.4,0.15,1.2,4,0.05);ball(W+0.5,y+0.95,z,0.22,10);}
{const x=C-4.5,z=C-19,y=G0+2;cyl(x,z,y,y+0.32,1.0,1.0,5);cyl(x,z,y+0.32,y+0.6,0.7,0.7,5);box(x+0.9,y+0.2,z+1.3,0.45,0.2,0.3,34,0.05);box(W+0.3,y+4.2,z,0.25,0.3,0.3,56);}
{const x=C-4.5,z=C+12.5,y=G0+2;ell(x,y+0.6,z,0.9,0.6,0.8,5);cyl(x+0.9,z+0.5,y,y+0.5,0.14,0.1,56);cyl(x+0.7,z-0.7,y,y+0.5,0.14,0.1,56);box(W+0.1,y+5.6,z,0.08,0.45,2.4,98);}
cyl(C-2.7,C+46.3,G0+9.5,G0+9.9,0.2,0.26,56);
for(const d of[-2.2,2.2]){cyl(C-6,C+66+d,G0+20,G0+26,0.12,0.12,56);box(C-6,G0+26.4,C+66+d,0.35,0.45,0.35,36);}
this.birds=null;
// what can be stood on besides the floor, south to north: two slabs over the chasm, the lift, a shelf, two planks that
// give way, and the shelf below the balcony
this.ledges=[[-2.5,2.5,-11.5,-6.5,2.06,{move:['z',2.5,6,0]}],[-2.5,2.5,1.5,6.5,2.06,{move:['z',2.5,6,0.5]}],[-2.5,2.5,15,20,5.78,{move:['y',3.72,6,0.75]}],
[-2.5,2.5,21,25.5,9.5],[-2.5,2.5,27,32,9.5,{crumble:0.6,back:3}],[-2.5,2.5,33.5,38.5,9.5,{crumble:0.6,back:3}],[-2.5,2.5,53,59,16]];
this.poi={stair:[0,-62],up:[-5,-66],niche:[-6,-58],rope:[-4.5,-19],oil:[-4.5,12.5],relic:[-4,45,9.5],chest:[-4,66,20],ring:[-4,70,20]};}};
}

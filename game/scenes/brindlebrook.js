// Brindlebrook, the village where the game starts: a pond, houses, a well, a market stall, fences and gardens, a windmill,
// a chest beyond the pond and a sealed door under the bluff.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,HT,DRm,G,pk,n2,prim,sm,hAt,ball,cap,ell,alimb,tree2,foot,cyl,box,lamp,crag,barrel,pillar,gableR}=K;
function house(sc,o){const ra=o.ra||0,c=Math.cos(ra),s=Math.sin(ra),x=o.x,z=o.z,w=o.w,l=o.l,g=hAt(x,z),y0=g+0.3,wh=o.wh||10,yt=y0+wh,sl=o.sl||0.85,WM=o.wall||110,
L=(u,v)=>[x+u*c-v*s,z+u*s+v*c],
el=(side,off,pr,yc,hw,hh,th,m,rd)=>{const p=side<2?L((side?-1:1)*(w+pr),off):L(off,(side===2?1:-1)*(l+pr));if(side<2)box(p[0],yc,p[1],th,hh,hw,m,rd==null?0.04:rd,ra);else box(p[0],yc,p[1],hw,hh,th,m,rd==null?0.04:rd,ra);return p;};
box(x,g-0.5,z,w+0.6,1.3,l+0.6,4,0.1,ra);
box(x,y0+wh/2,z,w,wh/2,l,WM,0.03,ra);
gableR(x,yt-0.2,z,w,l,WM,ra,sl);
gableR(x,yt-1.6*sl+1.15*Math.hypot(1,sl)-0.2,z,w+1.6,l+1.5,o.roof,ra,sl,1.15);
{const a=L(0,-l-1.5),b=L(0,l+1.5);cap(a[0],yt+w*sl+1.25,a[1],b[0],yt+w*sl+1.25,b[1],0.55,111);}
for(const su of[-1,1])for(const sv of[-1,1]){const p=L(su*w,sv*l);box(p[0],y0+wh/2,p[1],0.5,wh/2,0.5,111,0.12,ra);}
for(const side of[0,1,2,3]){const half=side<2?l:w;el(side,0,0.05,yt-0.45,half,0.45,0.3,111);el(side,0,0.05,y0+0.45,half,0.45,0.3,111);}
for(const side of[2,3])el(side,0,0.05,yt+w*sl*0.45,0.42,w*sl*0.45,0.3,111);
for(const q of o.win||[]){const yc=y0+(q[2]||5.6);el(q[0],q[1],0.05,yc,1.55,1.75,0.4,111);el(q[0],q[1],0.12,yc,1.05,1.25,0.5,116,0.02);el(q[0],q[1],0.3,yc-1.95,1.8,0.22,0.5,111);
if(q[3]){el(q[0],q[1],0.75,yc-2.55,1.5,0.35,0.4,59);for(const d of[-1,0,1]){const p=side2(q[0],q[1]+d,1.0);ball(p[0],yc-1.95,p[1],0.55,d?66:42);}}}
function side2(side,off,pr){return side<2?L((side?-1:1)*(w+pr),off):L(off,(side===2?1:-1)*(l+pr));}
const doors=[];
for(const q of o.door||[]){el(q[0],q[1],0.05,y0+4.2,2.6,4.2,0.4,111);el(q[0],q[1],0.14,y0+3.9,2.0,3.9,0.5,117,0.02);el(q[0],q[1],1.5,g-0.1,2.6,0.4,1.4,13,0.06);
const k=side2(q[0],q[1]+1.3,0.75);ball(k[0],y0+3.6,k[1],0.3,54);doors.push(side2(q[0],q[1],4));}
if(o.chim){const p=L(o.chim[0],o.chim[1]),top=yt+w*sl+3.4;box(p[0],(yt+top)/2,p[1],0.9,(top-yt)/2,0.9,25,0.05,ra);box(p[0],top+0.2,p[1],1.2,0.25,1.2,4,0.05,ra);sc.emit.push([p[0]-C,top+0.9-G0,p[1]-C,7,pk(214,214,224),pk(150,150,170)]);}
return{g,y0,yt,L,doors};}
return {name:'Brindlebrook',walk:true,gk:0.55,ry0:0,focus:[0,6,0],bg:[54,94,128],LD:[-0.5,0.7,-0.51],amb:[0.47,0.53,0.62],sun:[1.2,1.05,0.8],level:G0+0.3,shallow:true,wc:[[92,176,180],[38,100,146]],pv:[0.7,0.12,0.4],pcol:[255,244,200],pn:22,
foot:(x,z)=>Math.hypot(Math.max(Math.abs(x-C)-46,0),Math.max(Math.abs(z-C)-46,0))-14+2.2*n2(x*0.11+3,z*0.11+8),
h:(x,z)=>{const u=x-C,v=z-C;let h=G0+1+0.5*n2(x*0.05,z*0.05)+0.12*n2(x*0.31,z*0.31);
const f=(v-9.5)/6,t=Math.abs(u)<4.6?Math.round((f<0?0:f>1?1:f)*4)/4:(v>G.te(u)?1:0);
h+=3*t+t*4.6*Math.exp(-((u+38)*(u+38)+(v-40)*(v-40))/240);
const b=G.bl(x,z);if(b>0)h+=b*(12.5+3*n2(x*0.15,z*0.15)+1.5*n2(x*0.5,z*0.5));
return h-3.3*sm(1.22,0.5,G.pd(x,z));},
bot:(x,z)=>G0-8-2.6*n2(x*0.1,z*0.1)-1.2*n2(x*0.5,z*0.5),
top:(sx,sy,sz,j)=>{const u=sx-C,v=sz-C;if(sy<G0+0.95&&G.pd(sx,sz)<1.35)return 20;
if(G.bl(sx,sz)>0.3)return n2(sx*0.3,sz*0.3)>0.5?1:3;
const p=G.pt(sx,sz);if(p)return p;if(u>-24&&u<-12&&v>18&&v<29)return 121;return 1;},
side:(sx,sy,sz,j)=>{if(G.bl(sx,sz)>0.01&&sy>G0+4.6)return 82;if(DRm[j]<-2.2&&sy>G0-1)return 4;return sy>HT[j]-2.4?2:3;},
fix:(mm,sx,sy,sz,nx,ny,nz,hv)=>(mm===7&&ny>0.5&&hv<0.014&&G.pd(sx,sz)<0.8)?16:mm,
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv>0.993-0.1*G.fl(sx,sz))a(sx,sy+1,sz,8);}
else if(mm===20){if(hv>0.9&&sy>G0+0.25)for(let q=1;q<4;q++)a(sx,sy+q*0.6,sz,14);}
else if(mm===121){if(hv>0.45)a(sx,sy+0.5,sz,6);}},
init(){G.pd=(x,z)=>Math.hypot(x-(C+30),z-(C-28))/(10+2.2*n2(x*0.13+20,z*0.13));
G.te=u=>13+1.2*Math.sin(u*0.13)+0.8*Math.sin(u*0.37+1);
G.bl=(x,z)=>sm(0,1,(x-C-27+2*n2(z*0.2,3))/2.2)*sm(0,1,(z-C-36.5+2*n2(x*0.2,9))/2.2);
G.roads=[[0,-60,0,-14,3.3,115],[0,6,0,29,3.4,115],[-11,-6,-17.5,-6,2.4,115],[11,-4,17.5,-1.5,2.4,115],[0,-34,-16,-39,2,120],[2,-37,20,-42,1.9,120],[20,-42,36,-48,1.9,120],[36,-48,47,-45,1.9,120],[0,21,-24,31,2,120],[-24,31,-36,33,2,120],[0,21,24,27,2,120],[24,27,40,29,2.2,120],[9,-13,11,-21,2,120]];
G.pt=(x,z)=>{const u=x-C,v=z-C,nz=1.3*(n2(x*0.35,z*0.35)-0.5);if(Math.abs(u)<4.6&&v>9.5&&v<16.2)return 13;if(Math.hypot(u,v+5)<12.5+nz*1.4)return 115;
let best=0;for(const r of G.roads){const dx=r[2]-r[0],dz=r[3]-r[1];let f=((u-r[0])*dx+(v-r[1])*dz)/(dx*dx+dz*dz);f=f<0?0:f>1?1:f;if(Math.hypot(u-r[0]-dx*f,v-r[1]-dz*f)<r[4]+nz){if(r[5]===115)return 115;best=120;}}return best;};
G.beds=[[12,7,5],[-13,-17,4],[14,-12,3],[-7,24,4],[8,26,4],[-38,-14,4],[40,2,4],[-18,-28,3]];
G.fl=(x,z)=>{let s=0;for(const b of G.beds){const d=((x-C-b[0])*(x-C-b[0])+(z-C-b[1])*(z-C-b[1]))/(b[2]*b[2]);if(d<4)s+=Math.exp(-d);}return s>1?1:s;};},
build(){const LT=this.lights=[];this.emit=[];const sc=this,X1=[1,0,0],Y=(u,v)=>hAt(C+u,C+v);
house(sc,{x:C-27,z:C-6,w:7,l:9,roof:112,door:[[0,0]],win:[[0,-5.6],[0,5.6],[3,0,5.6,1],[2,0],[1,-4.5],[1,4.5]],chim:[-3,4]});
house(sc,{x:C+27,z:C-4,w:7,l:8,roof:113,door:[[1,2.5]],win:[[1,-3.8,5.6,1],[3,0],[2,0],[0,-3.8],[0,3.8]],chim:[3,-3]});
house(sc,{x:C-26,z:C-39,w:6,l:8,ra:-0.3,roof:112,wh:9,door:[[0,1]],win:[[0,-4.9],[3,0,5.4,1],[2,0],[1,0]],chim:[-2.5,-3]});
house(sc,{x:C,z:C+39,w:7,l:11,ra:Math.PI/2,roof:114,wh:11,door:[[1,0]],win:[[1,-6.6,5.8,1],[1,6.6,5.8,1],[0,-6],[0,6],[2,0],[3,0]],chim:[2.5,7]});
{const wx=C,wz=C-5,g=hAt(wx,wz);prim(wx-4,wx+4,g-1,g+3,wz-4,wz+4,4,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-wx,z-wz)-2.5)-0.55,y-(g+2.2),g-0.8-y)*0.9);
cyl(wx,wz,g+0.2,g+1.5,2.2,2.2,64);for(const s of[-1,1])box(wx+s*2.75,g+4,wz,0.35,4,0.35,111,0.08);
box(wx,g+7.3,wz,3.3,0.3,0.35,111,0.05);gableR(wx,g+7.4,wz,2.5,3.8,112,Math.PI/2,0.75,0.9);cap(wx,g+7,wz,wx,g+3.6,wz,0.13,5);cyl(wx,wz,g+2.6,g+3.6,0.6,0.5,59);}
{const sx=C+15.5,sz=C-19,g=hAt(sx,sz);for(const a of[-1,1])for(const b of[-1,1])cap(sx+a*3.5,g-0.3,sz+b*2.3,sx+a*3.5,g+6.3,sz+b*2.3,0.3,5);
gableR(sx,g+6.2,sz,3.4,4.6,119,Math.PI/2,0.5,0.8);box(sx,g+1.5,sz-1.8,3.5,1.5,0.9,34,0.05);
for(let k=0;k<4;k++){ball(sx-2.6+k*0.75,g+3.45,sz-1.9,0.42,53);ball(sx+0.6+k*0.72,g+3.45,sz-1.8,0.42,47);}ball(sx-2.3,g+3.9,sz-1.9,0.42,53);ball(sx-1.5,g+3.9,sz-1.9,0.42,53);ball(sx+1,g+3.9,sz-1.8,0.42,47);
box(sx+5.4,g+1.1,sz+0.5,1.1,1.1,1.1,59,0.05);box(sx+5.2,g+3,sz+0.4,0.9,0.8,0.9,59,0.05,0.4);box(sx+5.6,g+1,sz-2.2,1,1,1,34,0.05,0.2);barrel(sx-5.2,sz+1.2,g-0.1,2.4);barrel(sx-5.6,sz-0.9,g-0.1,2.4);}
{const g=Y(0,-53);for(const s of[-1,1]){box(C+s*5.6,g+3.2,C-53,0.65,3.6,0.65,111,0.1);box(C+s*13.6,g+0.8,C-53,7,1.5,0.75,4,0.1);box(C+s*21,g+1.4,C-53,0.9,2.1,0.9,4,0.1);}
for(const s of[-1,1]){box(C+s*5.6,g+7,C-53,0.95,0.3,0.95,4,0.08);ball(C+s*5.6,g+8,C-53,0.75,11);LT.push([C+s*5.6,g+8,C-53,0.4,1,0.72,0.4]);}}
const fence=(pts)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/3.2));for(let k=0;k<n;k++){const x0=C+a[0]+(b[0]-a[0])*k/n,z0=C+a[1]+(b[1]-a[1])*k/n,x1=C+a[0]+(b[0]-a[0])*(k+1)/n,z1=C+a[1]+(b[1]-a[1])*(k+1)/n,g0=hAt(x0,z0),g1=hAt(x1,z1);
cap(x0,g0-0.3,z0,x0,g0+2.4,z0,0.32,5);if(k===n-1)cap(x1,g1-0.3,z1,x1,g1+2.4,z1,0.32,5);cap(x0,g0+1.1,z0,x1,g1+1.1,z1,0.2,34);cap(x0,g0+2,z0,x1,g1+2,z1,0.2,34);}}};
fence([[-25,17.5],[-25,30],[-11,30],[-11,26]]);fence([[-11,19],[-11,17.5],[-25,17.5]]);fence([[-8,-18],[-8,-30]]);fence([[8,-20],[8,-33]]);fence([[-50,14],[-50,-2]]);fence([[30,14.5],[50,14.5]]);
for(const q of[[-9.5,-14.5],[9.5,4],[6.5,18.5]])lamp(sc,C+q[0],C+q[1],8,11,0.5,[1,0.72,0.4]);
for(const s of[-1,1]){box(C+s*5.4,Y(s*5.4,9)+1.1,C+9.4,0.75,1.5,0.75,4,0.1);box(C+s*5.4,Y(s*5.4,17)+1.1,C+16.6,0.75,1.5,0.75,4,0.1);}
{const g=Y(6,-41);cap(C+6,g-0.3,C-41,C+6,g+5.4,C-41,0.3,5);box(C+7.2,g+4.6,C-41,1.5,0.5,0.2,34,0.04);box(C+4.9,g+3.4,C-41,1.4,0.5,0.2,34,0.04);}
for(const q of[[24,-15.5,0.5],[42,-17,1.2]]){const x=C+q[0],z=C+q[1],g=hAt(x,z);box(x,g+1.25,z,1.9,0.2,0.65,34,0.05,q[2]);for(const s of[-1,1])box(x+s*1.4*Math.cos(q[2]),g+0.5,z+s*1.4*Math.sin(q[2]),0.22,0.7,0.5,5,0.04,q[2]);}
for(const q of[[-17.5,-18],[-16,-19.8],[33,6.5],[-16.5,-45],[13,33],[11.5,31.6]])barrel(C+q[0],C+q[1],Y(q[0],q[1])-0.1,2.3);
for(const q of[[34.5,8,0.2],[-15,-32.5,0.5],[-13.5,34,0.1]]){const g=Y(q[0],q[1]);box(C+q[0],g+1.05,C+q[1],1.1,1.1,1.1,59,0.05,q[2]);}
for(const q of[[-46,34],[-44,31.5],[-47.5,30.8],[-28,45]]){const g=Y(q[0],q[1]);ell(C+q[0],g+1.1,C+q[1],1.7,1.25,1.25,83);}
for(const q of[[21.5,-17,1.5,3],[41.5,-31,1.5,5],[23,-37.5,1.3,7],[38,-20.5,1.6,2],[-52,-12,2,4],[52,-26,1.7,8]]){const g=Y(q[0],q[1]);crag(C+q[0],g+q[2]*0.3,C+q[1],q[2]*1.2,q[2],q[2]*1.1,3,q[3]);}
for(const q of[[-36,6,2],[-17,4.5,1.7],[35.5,-13,1.8],[18,8.5,1.6],[-10,-25,1.6],[10,-45,1.8],[-36,-27,2],[-18,45,1.8],[17,46,1.9],[44,20,1.9],[-52,40,2],[26,-50,1.7],[52,-40,1.8],[45,-52,1.7]]){const g=Y(q[0],q[1]);ell(C+q[0],g+q[2]*0.55,C+q[1],q[2]*1.15,q[2],q[2]*1.15,6);}
let k=1;for(const q of[[-49,-26,13,6],[-47,7,14,6.3],[-50,-48,12,5.6],[-36,-55,11,5.2],[50,-9,13,6],[48,7,12,5.6],[47,-24,12,5.4],[55,-47,11,5],[-53,24,13,6],[-15,52,12,5.5],[19,21,12,5.6],[22,51,12,5.4],[52,23,12,5.6],[-52,52,11,5.2]])tree2(C+q[0],C+q[1],q[2],q[3],k++);
const mx=C-38,mz=C+40,m0=hAt(mx,mz)-0.4,ay=m0+19.5,sz=mz-5.7;
cyl(mx,mz,m0-0.6,m0+2,5.5,5.3,4);cyl(mx,mz,m0+2,m0+20,5,3.4,123);cyl(mx,mz,m0+20,m0+25.5,4.3,0.4,113);cyl(mx,mz,m0+19.6,m0+20.4,4.2,4.2,111);
box(mx,m0+3.9,mz-5,1.8,3.7,0.5,117,0.03);box(mx,m0+4.1,mz-4.8,2.3,4.1,0.4,111,0.03);box(mx,m0+12.5,mz-4.1,1.1,1.3,0.45,116,0.03);box(mx,m0+12.5,mz-4,1.5,1.7,0.4,111,0.03);cap(mx,ay,mz-2.5,mx,ay,sz+0.3,0.55,111);
const cx=C+48,cz=C-44,cg=hAt(cx,cz)-0.1;box(cx,cg+0.9,cz,1.3,0.9,1.8,59,0.05);for(const s of[-1,1])box(cx,cg+0.9,cz+s*1.15,1.38,0.95,0.24,54,0.05);box(cx-1.38,cg+1.45,cz,0.2,0.34,0.34,54,0.04);box(cx,cg+1.72,cz,0.95,0.14,1.45,10,0);
const dx=C+40,dz=C+36,dg=hAt(dx,C+29);box(dx,dg+5.4,dz,5.6,5.6,3.3,98,0.1);box(dx,dg+11.3,dz-0.2,6.3,0.5,3.6,4,0.08);for(const s of[-1,1])pillar(dx+s*4.9,dz-3.9,dg-0.4,9.6);
box(dx,dg+4.2,dz-3.45,2.7,4.2,0.4,36,0.02);box(dx,dg+9.3,dz-3.5,2.2,0.3,0.4,31,0.02);LT.push([dx,dg+9.3,dz-5,0.7,0.35,0.9,0.8]);
G.dyn=[{cx:mx,cy:ay,cz:sz,ax:2,sp:0.5,amp:0,bb:[mx-15,mx+15,ay-15,ay+15,sz-1.6,sz+1.6],fn:()=>{for(let q=0;q<4;q++){const a=q*1.5708+0.3,c=Math.cos(a),s=Math.sin(a);alimb([mx,ay,sz],[mx+12.6*c,ay+12.6*s,sz],0.36,0.32,111,X1);alimb([mx+3.2*c-1.75*s,ay+3.2*s+1.75*c,sz+0.1],[mx+12*c-1.75*s,ay+12*s+1.75*c,sz+0.1],0.3,1.5,122,X1);}ball(mx,ay,sz,1.05,111);}},
{cx:cx+1.35,cy:cg+1.8,cz:cz,ax:2,sp:0,amp:0,bb:[cx-2.2,cx+2.4,cg+1.3,cg+3.6,cz-2.6,cz+2.6],fn:()=>{box(cx,cg+2.25,cz,1.22,0.36,1.72,59,0.12);for(const s of[-1,1])box(cx,cg+2.25,cz+s*1.15,1.3,0.42,0.24,54,0.12);box(cx-1.4,cg+2.05,cz,0.2,0.26,0.34,54,0.04);}},
{cx:dx-2.6,cy:dg+4.2,cz:dz-4.1,ax:1,sp:0,amp:0,bb:[dx-3.4,dx+3.4,dg-0.6,dg+9,dz-5,dz-3.2],fn:()=>{box(dx,dg+4.1,dz-4.1,2.55,4.1,0.3,117,0.04);for(const h of[1.6,4.1,6.6])box(dx,dg+h,dz-4.3,2.6,0.32,0.3,56,0.03);box(dx+1.7,dg+4.1,dz-4.55,0.3,0.5,0.2,54,0.04);}}];
this.birds=[8,36,-12,4];
this.blockers=[[cx-1.9,cx+1.9,cz-2.4,cz+2.4],[dx-3.2,dx+3.2,dz-5.6,dz-3]];
this.poi={start:[0,-46],elder:[5,-10.5],merchant:[9.8,-21],girl:[12,7],guard:[-10.5,-43],chest:[48,-44,cg+1-G0],door:[40,31.6,dg+4-G0],mill:[-38,40]};
}};
}

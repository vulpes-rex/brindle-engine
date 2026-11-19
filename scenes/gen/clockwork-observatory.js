// Clockwork observatory: A copper-domed observatory with a telescope, turning brass gears, a spinning orrery, a clock tower and steam.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,HT,G,pk,h3,n2,prim,hAt,ball,cap,ell,foot,cyl,box,steps,lamp,tree,pyr}=K;
function gear(cx,cy,cz,R,th,teeth,ax,m){prim(cx-R-3,cx+R+3,cy-R-3,cy+R+3,cz-R-3,cz+R+3,m,(x,y,z)=>{let a,b,w;if(ax===1){a=x-cx;b=z-cz;w=y-cy;}else if(ax===2){a=x-cx;b=y-cy;w=z-cz;}else{a=z-cz;b=y-cy;w=x-cx;}
const r=Math.hypot(a,b),an=Math.atan2(b,a),rr=R+(Math.sin(an*teeth)>0?0.8:-0.2),sp=6.2832/5,am=((an%sp)+sp)%sp-sp/2,ds=Math.abs(r*Math.sin(am))-0.7;
return Math.max(Math.min(Math.max(r-rr,(R-2.4)-r),r-1.8,Math.max(ds,r-R+1)),Math.abs(w)-th)*0.8;});}
return {name:'Clockwork observatory',cap:'A copper-domed observatory with a telescope, turning brass gears, a spinning orrery, a clock tower and steam.',bg:[14,10,26],LD:[-0.45,0.68,0.58],amb:[0.4,0.42,0.62],sun:[1.05,0.86,0.7],level:null,pv:[0.2,0.6,0.1],pcol:[255,220,150],pn:30,foot,
h:(x,z)=>{const r=Math.hypot(x-(C-4),z-(C-4));let h=G0+2*n2(x*0.07,z*0.07);if(r<25)h=Math.max(h,G0+3.5);if(r<15)h=G0+6.5;if(Math.hypot(x-(C+25),z-(C+21))<8)h=Math.max(h,G0+3);return h;},
bot:(x,z)=>G0-9-12*Math.max(0,1-(Math.hypot(x-C,z-C)/50)**2)-4*n2(x*0.15,z*0.15),
top:(sx,sy,sz,j,hv)=>sy>G0+2.8?4:1,side:(sx,sy,sz,j)=>sy>G0+2?4:sy>HT[j]-3?2:3,
fix:(mm,sx,sy,sz)=>{if(mm===55){const a=Math.atan2(sz-(C-4),sx-(C-4))*8/6.2832;if(a-Math.floor(a)<0.1)return 54;}if(mm===22){const y=sy-(G0+6.5);if((y>0.4&&y<1.3)||(y>8.6&&y<9.6))return 54;}return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.3)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.97)a(sx,sy+1.8,sz,8);}},
build(){this.lights=[];const cx=C-4,cz=C-4,by=G0+6.5;
cyl(cx,cz,by-1,by+10,9,9,22);prim(cx-13,cx+13,by+8,by+23,cz-13,cz+13,55,(x,y,z)=>{const u=x-cx,v=y-by-10,w=z-cz,rr=Math.hypot(u,v,w),sl=(u*0.707+w*0.707);return Math.max(rr-9.6,-(rr-8.8),-v,-Math.max(Math.abs(u*0.707-w*0.707)-1.5,-sl-1));});
cyl(cx,cz,by+9.6,by+10.6,10.1,10.1,54);
const ta=[cx+2,by+12,cz+2],tb2=[cx+11,by+20,cz+11];cap(ta[0],ta[1],ta[2],tb2[0],tb2[1],tb2[2],1.5,54);cap(tb2[0],tb2[1],tb2[2],tb2[0]+0.9,tb2[1]+0.8,tb2[2]+0.9,1.9,56);ball(tb2[0]+1.5,tb2[1]+1.35,tb2[2]+1.5,1.3,61);cyl(cx+1,cz+1,by+10,by+13,2.2,1.6,56);
box(cx+6.2,by+2.5,cz+6.2,1.3,2.5,1.3,36,0.3,0.785);box(cx+7.4,by+0.4,cz+7.4,2,0.5,2,4,0.1,0.785);
for(const a of[-0.4,2.0,3.5,5.1]){ball(cx+8.8*Math.cos(a),by+5.5,cz+8.8*Math.sin(a),1,11);this.lights.push([cx+11*Math.cos(a),by+5.5,cz+11*Math.sin(a),0.7,1,0.7,0.35]);}
steps(C+16.5,C+16.5,G0+1,C+12,C+12,G0+3.7,3,2.2,4);steps(C+8.6,C+8.6,G0+4,C+5.6,C+5.6,G0+6.7,3,2,4);
cap(cx-9,by+1,cz+2,cx-13,by+1,cz+2,0.6,54);cap(cx-13,by+1,cz+2,cx-13,G0+3,cz+2,0.6,54);ball(cx-13,by+1,cz+2,0.9,54);cap(cx-13,G0+4,cz+2,cx-13,G0+4,cz+12,0.6,54);ball(cx-13,G0+4,cz+12,0.9,56);
cyl(cx-6,cz-11,by-1,by+15,1.2,1,56);cyl(cx-6,cz-11,by+15,by+16,1.5,1.5,54);this.emit=[[cx-6-C,by+17-G0,cz-11-C,8,pk(210,214,230),pk(130,134,160)]];
const kx=C-30,kz=C+22,kb=hAt(kx,kz);box(kx,kb+8,kz,2.6,9,2.6,22,0.1);box(kx,kb-0.2,kz,3.1,1,3.1,4,0.1);pyr(kx,kb+17,kz,3.6,0.9,24);ball(kx,kb+21.2,kz,0.5,54);ell(kx+2.7,kb+13,kz,0.35,1.7,1.7,11);ell(kx,kb+13,kz+2.7,1.7,1.7,0.35,11);box(kx,kb+2,kz+2.6,0.9,1.8,0.3,36);this.lights.push([kx+4.5,kb+13,kz+4.5,1,1,0.75,0.4]);
lamp(this,C+19,C+12,6,10,1,[1,0.8,0.45]);lamp(this,C+10,C+21,6,10,1,[1,0.8,0.45]);lamp(this,C-22,C-28,6,10,1,[1,0.8,0.45]);lamp(this,C+32,C-20,6,10,1,[1,0.8,0.45]);
tree(C+30,C-30,15,6,21,63);tree(C-34,C-8,13,5,22,63);tree(C-10,C+36,12,5,23,63);tree(C+36,C+2,10,4.5,24,6);
for(let i=0;i<8;i++){const x=C-38+h3(i,91,1)*76,z=C-38+h3(i,91,2)*76;if(Math.hypot(x-cx,z-cz)<27)continue;box(x,hAt(x,z)+0.5,z,1+h3(i,91,3)*1.2,0.8,0.9+h3(i,91,4),3,0.8,i);}
const gy=G0+6.5+4.2,ox=C+25,oz=C+21,oy=G0+3;this.lights.push([ox,oy+8,oz,1.4,1,0.85,0.5]);
G.dyn=[{cx:cx,cy:gy,cz:cz+11.5,ax:2,sp:0.5,fn:()=>gear(cx,gy,cz+11.5,7,0.7,14,2,54)},
{cx:cx+11.2,cy:gy-1.4,cz:cz+11.5,ax:2,sp:-0.875,fn:()=>gear(cx+11.2,gy-1.4,cz+11.5,4,0.7,8,2,56)},
{cx:cx-11.5,cy:gy+1,cz:cz-3,ax:3,sp:-0.6,fn:()=>gear(cx-11.5,gy+1,cz-3,5.5,0.7,11,3,54)},
{cx:ox,cy:oy,cz:oz,ax:1,sp:0.45,fn:()=>{gear(ox,oy+0.8,oz,6.2,0.5,12,1,54);cap(ox,oy+0.8,oz,ox,oy+8,oz,0.5,56);ball(ox,oy+8.8,oz,1.5,10);cap(ox,oy+5,oz,ox+5.5,oy+5,oz,0.3,54);ball(ox+5.5,oy+5,oz,1,23);cap(ox,oy+6.5,oz,ox-3.5,oy+6.5,oz+2.5,0.3,54);ball(ox-3.5,oy+6.5,oz+2.5,0.75,55);cap(ox,oy+3.5,oz,ox-2,oy+3.5,oz-6.5,0.3,54);ball(ox-2,oy+3.5,oz-6.5,1.2,61);}}];
}};
}

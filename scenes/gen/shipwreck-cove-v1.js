// Shipwreck cove, first version: A broken hull with exposed ribs and a torn sail in a rocky cove, with a treasure chest, a cave, palms and a beached rowboat.
// The prototype replaced it with a later Shipwreck cove (shipwreck-cove.js) and never showed this one.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,HT,n2,n3,prim,sm,hAt,sdBox,ball,cap,ell,foot,cyl,box,palm,lamp,hull}=K;
return {name:'Shipwreck cove',water:[34,120,140],cap:'A broken hull with exposed ribs and a torn sail in a rocky cove, with a treasure chest, a cave, palms and a beached rowboat.',bg:[10,16,26],LD:[-0.5,0.66,0.55],amb:[0.46,0.52,0.66],sun:[1.2,1.0,0.75],level:G0,pv:[2,0.2,1],pcol:[230,240,244],pn:24,foot,
h:(x,z)=>{const r=Math.hypot(x-(C+10),z-(C+10)),back=((C-x)+(C-z))/2;let h=G0-6+9.5*sm(14,30,r)*sm(-10,12,back)+1.5*n2(x*0.1,z*0.1)+4*Math.exp(-((x-(C+7))**2+(z-(C+9))**2)/120);h+=Math.floor(sm(12,26,back+7*n2(x*0.08,z*0.08)-4)*3.3)*6;return h;},
bot:(x,z)=>G0-13-2*n2(x*0.2,z*0.2),
top:(sx,sy)=>sy<G0+0.7?58:sy>G0+6.5?1:20,side:()=>3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv,j)=>{if(mm===7&&ny>0.5&&HT[j]>G0-1.6&&hv<0.6)return 33;if(mm===59&&sy<G0+2.5&&n3(sx*0.35,sy*0.35,sz*0.35)>0.6)return 42;if(mm===3&&ny>0.6&&n3(sx*0.25,sy*0.25,sz*0.25)>0.6)return 18;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.35)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.96)a(sx,sy+1.8,sz,8);}else if(mm===58&&hv>0.99)a(sx,sy+0.5,sz,62);},
build(){this.lights=[];const wx=C+8,wz=C+10,wy=G0+4.6,c=Math.cos(0.75),s=Math.sin(0.75),cr=Math.cos(0.3),sr=Math.sin(0.3);
const SC=1.5,L=(fn,m)=>prim(wx-26,wx+26,wy-12,wy+22,wz-26,wz+26,m,(x,y,z)=>{const dx=x-wx,dy=y-wy,dz=z-wz,u=dx*c+dz*s,w0=dz*c-dx*s;return fn(u/SC,(dy*cr+w0*sr)/SC,(w0*cr-dy*sr)/SC,x,y,z)*SC;});
const W2=(u,v,w)=>{u*=SC;v*=SC;w*=SC;const dy=v*cr-w*sr,w0=v*sr+w*cr;return[wx+u*c-w0*s,wy+dy,wz+u*s+w0*c];};
L((u,v,w,x,y,z)=>{let d=Math.max((Math.hypot(u/13,v/5,w/4.2)-1)*4.2,-(Math.hypot(u/12.3,(v-0.8)/5,w/3.6)-1)*3.6,v-2.2);d=Math.max(d,-(Math.abs(u-1.5)-1.4-2*(n3(x*0.4,y*0.4,z*0.4)-0.5)));if(u>3&&v>-1.4){const f=u/2.4-Math.floor(u/2.4);if(f>0.3)d=Math.max(d,0.5);}return d;},59);
L((u,v,w)=>Math.max(Math.abs(v-1.2)-0.3,(Math.hypot(u/12.3,w/3.6)-1)*3,u+0.3),34);
L((u,v,w)=>sdBox(u+8.2,v-3.5,w,2.8,1.5,2.9)-0.1,59);L((u,v,w)=>sdBox(u+8.2,v-5.2,w,3.2,0.3,3.2),34);
L((u,v,w)=>Math.min(sdBox(u+5.35,v-3.6,w-1.3,0.2,0.6,0.6),sdBox(u+5.35,v-3.6,w+1.3,0.2,0.6,0.6)),11);
let p=W2(-3,1.2,0),q=W2(-3.6,17,0);cap(p[0],p[1],p[2],q[0],q[1],q[2],0.9,5);let a=W2(-3.5,13,-5),b=W2(-3.5,13,5);cap(a[0],a[1],a[2],b[0],b[1],b[2],0.4,5);
L((u,v,w,x,y,z)=>Math.max(sdBox(u+3.9,v-9.3,w,0.25,3.4,4.4),(n3(x*0.33,y*0.33,z*0.33)-0.6)*4),57);
const lp=W2(-5.2,3.6,0);this.lights.push([lp[0],lp[1],lp[2],1.1,1,0.7,0.35]);this.birds=[q[0]-C,q[1]+3-G0,q[2]-C,4];this.waves=[wx-C,wz-C];
cap(C-8,hAt(C-8,C-16)+0.6,C-16,C+8,hAt(C+8,C-24)+0.8,C-24,0.6,5);
palm(C-19,C+9,13,1);palm(C+9,C-19,15,2);palm(C-7,C-9,11,3);
const kx=C-17,kz=C-3,kb=hAt(kx,kz);box(kx,kb+0.9,kz,1.7,1.1,1.1,34,0.1,0.5);box(kx-0.5,kb+2.3,kz-0.6,1.7,0.3,1.1,5,0.1,0.5);ball(kx,kb+2,kz,0.7,54);ball(kx+0.8,kb+2,kz+0.3,0.6,54);ball(kx+2.2,kb+0.4,kz+1.2,0.6,54);ball(kx+0.2,kb+2.5,kz,0.45,10);this.lights.push([kx,kb+3,kz,0.9,1,0.85,0.4]);
lamp(this,kx-4,kz+3,5,10,1.1,[1,0.8,0.45]);
cyl(C-12,C+3,hAt(C-12,C+3)-0.4,hAt(C-12,C+3)+2.2,1,1,5);box(C-9,hAt(C-9,C+6)+0.5,C+6,1.2,1,1.2,34,0.1,0.9);cyl(C-3,C-13,hAt(C-3,C-13)-0.2,hAt(C-3,C-13)+2,0.95,0.95,5);
hull(C+2,hAt(C+2,C-15)+0.8,C-15,2.3,34);
const ax=C-13,az=C+10,ab=hAt(ax,az);cap(ax,ab,az,ax+0.8,ab+4.5,az,0.35,56);cap(ax-1.6,ab+0.6,az,ax+1.8,ab+0.2,az,0.35,56);cap(ax-0.6,ab+4,az,ax+2,ab+4.3,az,0.3,56);
const cvx=C-23,cvz=C-16,cvb=hAt(C-19,C-12);ell(cvx+2,cvb+3,cvz+2,3.4,3.6,3.4,36);ball(cvx+3.2,cvb+3,cvz+3.2,0.6,11);this.lights.push([cvx+4.5,cvb+3,cvz+4.5,1,1,0.6,0.3]);
const rk=[[C+26,C+30,2.6,5],[C+34,C+16,2,4],[C+20,C+36,1.8,3],[C+36,C+34,2.4,6],[C+30,C-2,1.6,3]];rk.forEach((r2,k)=>box(r2[0],G0-3+r2[3]/2,r2[1],r2[2],r2[3]/2+3,r2[2]*0.8,3,1.2,k));
}};
}

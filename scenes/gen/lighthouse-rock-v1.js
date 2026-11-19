// Lighthouse rock, first version: A sea stack with a striped lighthouse and sweeping beam, a keeper’s hut, stairs down to a jetty, boats, a buoy and gulls.
// The prototype replaced it with a later Lighthouse rock (lighthouse-rock.js) and never showed this one.
// A scene for the generator in engine/gen/genmain.js. It must stay self-contained: the generator hands this function to a
// Web Worker as text, so it can use only what it takes from the kit `K`.
export default function (K) {
const {C,G0,HT,G,pk,n2,n3,prim,hAt,ball,cap,foot,cyl,box,gable,steps,hull}=K;
return {name:'Lighthouse rock',water:[30,84,130],cap:'A sea stack with a striped lighthouse and sweeping beam, a keeper’s hut, stairs down to a jetty, boats, a buoy and gulls.',bg:[10,14,28],LD:[-0.5,0.62,0.6],amb:[0.42,0.5,0.7],sun:[1.1,0.86,0.66],level:G0,pv:[3,0.2,1.5],pcol:[230,240,244],pn:30,foot,
h:(x,z)=>{const r=Math.hypot(x-(C-4),z-(C-2)),m=Math.max(0,24*(1-(r/27)**2))*(0.7+0.6*n2(x*0.11,z*0.11));const h=G0-7+2*n2(x*0.1+5,z*0.1)+Math.min(m,15+0.6*n2(x*0.3,z*0.3));return h>G0+0.5?Math.floor(h/2)*2+0.8*n2(x*0.4,z*0.4):h;},
bot:(x,z)=>G0-12-2*n2(x*0.2,z*0.2),
top:(sx,sy,sz,j,hv,ny)=>sy<G0+1.4?35:(sy>G0+7&&ny>0.8)?1:3,side:(sx,sy)=>sy<G0+1.4?35:3,
fix:(mm,sx,sy,sz,nx,ny,nz,hv,j)=>{if(mm===7&&ny>0.5&&HT[j]>G0-2.4&&hv<0.7)return 33;if(mm===35&&n3(sx*0.3,sy*0.3,sz*0.3)>0.6)return 42;if(mm===3&&ny>0.6&&n3(sx*0.25,sy*0.25,sz*0.25)>0.62)return 18;return mm;},
scatter:(mm,sx,sy,sz,hv,a)=>{if(mm===1){if(hv<0.3)a(sx,sy+0.8+hv*3,sz,15);if(hv>0.97)a(sx,sy+1.8,sz,8);}},
build(){const cx=C-4,cz=C-2,by=hAt(cx,cz);G.lby=by;this.lights=[[cx,by+33,cz,2.4,1,0.85,0.5]];this.beam=[cx-C,cz-C];this.waves=[cx-C,cz-C];this.birds=[cx-C,by+36-G0,cz-C,5];
cyl(cx,cz,by-2,by+1,6.3,5.8,4);cyl(cx,cz,by+1,by+30,5,3.3,39);cyl(cx,cz,by+29.2,by+30,5.6,5.6,4);cyl(cx,cz,by+30,by+31,5.2,5.2,24);cyl(cx,cz,by+31,by+35,2.4,2.4,10);cyl(cx,cz,by+35,by+36,3.5,3.5,24);cyl(cx,cz,by+36,by+40,3.5,0.2,23);
cap(cx,by+40,cz,cx,by+43.5,cz,0.25,24);box(cx+1.5,by+42.4,cz,1.3,0.6,0.2,23);
for(let k=0;k<12;k++){const a=k*0.5236;cap(cx+4.8*Math.cos(a),by+31,cz+4.8*Math.sin(a),cx+4.8*Math.cos(a),by+33,cz+4.8*Math.sin(a),0.28,24);}
prim(cx-8,cx+8,by+31,by+35,cz-8,cz+8,24,(x,y,z)=>Math.max(Math.abs(Math.hypot(x-cx,z-cz)-4.8)-0.25,Math.abs(y-by-33)-0.25));
box(cx+3.3,by+3.4,cz+3.3,1.2,2.2,1.2,36,0.2,0.785);box(cx+4.6,by+0.6,cz+4.6,1.8,0.6,1.8,4,0.1,0.785);
box(cx+2.9,by+14,cz+2.9,0.8,1.2,0.8,36,0.1,0.785);box(cx-2.5,by+22,cz+2.5,0.7,1.1,0.7,36,0.1,-0.785);box(cx-3.2,by+8,cz+3.2,0.8,1.2,0.8,36,0.1,-0.785);box(cx+2.6,by+23,cz-2.6,0.7,1.1,0.7,36,0.1,-0.785);box(cx-3,by+12,cz-3,0.8,1.2,0.8,36,0.1,0.785);
const hx=cx+12,hz=cz+5,hb=hAt(hx,hz);box(hx,hb-1.5,hz,4.8,2.6,4,4,0.2);box(hx,hb+3,hz,4,2.4,3.2,22,0.1);gable(hx,hb+5.3,hz,4.9,3.9,25);box(hx+2,hb+8.6,hz-1.5,0.7,1.7,0.7,4);
box(hx-1.2,hb+2.7,hz+3.2,0.9,1.6,0.35,36);box(hx+2.2,hb+3.5,hz+3.25,0.8,0.8,0.3,11);box(hx+4.05,hb+3.5,hz,0.3,0.8,0.8,11);this.lights.push([hx+2.2,hb+3.5,hz+5.5,0.9,1,0.7,0.35]);
this.emit=[[hx+2-C,hb+10.5-G0,hz-1.5-C,7,pk(150,150,165),pk(96,98,120)]];
for(let k=0;k<5;k++){box(hx-6.5+k*0.2,hb+0.6+k*0.5,hz-2.5,0.45,0.45,1.6,5,0.1);}
for(let k=3;k<14;k++){if(k===8||k===9)continue;const a=k*0.449,x=cx+13*Math.cos(a),z=cz+11.5*Math.sin(a),b=hAt(x,z);if(b<by-1.2)continue;box(x,b+0.9,z,1.6,1.1,0.6,4,0.15,a+1.57);}
steps(C+17,C+13,G0+1.7,cx+8,cz+10,by+0.3,7,1.7,4);
box(C+28,G0+1.7,C+13,11,0.4,2,34);for(let i=0;i<4;i++)for(const s of[-1.9,1.9]){const x=C+20+i*6.2,z=C+13+s;cap(x,G0-6,z,x,G0+2.8,z,0.5,5);}
box(C+33,G0+3.1,C+12.2,1,1,1,34,0.1,0.3);box(C+35.4,G0+2.9,C+13.8,0.8,0.8,0.8,34,0.1,0.8);cyl(C+30,C+14,G0+2.1,G0+4.3,0.95,0.95,5);cyl(C+24.5,C+12,G0+2.1,G0+4,0.85,0.85,5);
cap(C+38.6,G0-2,C+11,C+38.6,G0+5.4,C+11,0.5,5);ball(C+38.6,G0+6.3,C+11,0.8,10);this.lights.push([C+38.6,G0+6.3,C+11,1.1,1,0.8,0.45]);
hull(C+31,G0+0.4,C+19,0,34);box(C+31,G0+0.9,C+19,0.5,0.25,1.7,5);hull(C+12,G0+0.4,C+30,0.9,23);
const ux=C+2,uz=C+37;cyl(ux,uz,G0-0.6,G0+1.5,1.8,1.3,23);cap(ux,G0+1.5,uz,ux,G0+4.2,uz,0.3,24);ball(ux,G0+4.7,uz,0.55,11);this.lights.push([ux,G0+4.7,uz,0.5,1,0.6,0.3]);
box(cx-12,G0+5,cz-8,2.6,8,2.3,3,1.2,0.4);box(cx-9,G0+4,cz+14,2,6,2,3,1,1.1);box(cx+10,G0+3,cz-13,2.2,6,2,3,1.1,2);
const st=[[C-30,C+24,3.5,7],[C-34,C-20,2.8,11],[C+24,C-30,3.2,6],[C-14,C+35,2.4,4],[C+36,C-12,2,5],[C-31,C-25,1.8,6],[C+29,C-34,1.6,3]];for(let k=0;k<st.length;k++){const q=st[k];box(q[0],G0-3+q[3]/2,q[1],q[2],q[3]/2+3,q[2]*0.8,3,1.3,k*0.7);}
}};
}

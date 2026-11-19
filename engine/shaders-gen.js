// GLSL for the "gen" look: soft round splats under a tilted camera, with glows, sprites, ground decals, battle effects and a
// finishing pass (depth outlines, contact shade, vignette, optional 5-bit ordered dither).

// world -> clip space. Orthographic when uPersp is 0 (the field); battles add a little perspective. Depth stays linear in the
// distance from the focus, so the finishing pass reads it the same way either way.
const PROJ=`uniform float uPersp;
vec4 proj(vec3 p){vec3 w=p-uFocus;float X=w.x*uCam.x+w.z*uCam.y;float Z=w.z*uCam.x-w.x*uCam.y;float d=Z*uCam.z-w.y*uCam.w;
float q=max(1.0+d*uPersp,0.05);return vec4(X*uScale,(w.y*uCam.z+Z*uCam.w)*uScale,d/110.0*q,q);}`;
export const VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aC;
layout(location=1) in vec3 iPos;
layout(location=2) in vec3 iSz;
layout(location=3) in vec4 iN;
layout(location=4) in vec4 iCol;
uniform vec4 uCam;uniform vec3 uFocus;uniform float uScale;uniform float uTime;uniform vec3 uVel;uniform vec4 uGC[9];uniform float uGAn[9];
${PROJ}
out vec2 vUV;out vec4 vCol;out vec3 vW;
void main(){
float flag=floor(iCol.a*255.0+0.5);
vec3 V=vec3(uCam.y*uCam.z,uCam.w,-uCam.x*uCam.z);
vec3 n=iN.xyz;float sway=iN.w;vec3 p=iPos;vec2 S=iSz.xy;vec3 t;vec3 b;
if(sway<0.0){int g=int(floor(-sway*127.0+0.5));vec4 gc=uGC[g];float a=uGAn[g];float ca=cos(a);float sa=sin(a);vec3 d=p-gc.xyz;
if(gc.w<1.5){p.x=gc.x+d.x*ca-d.z*sa;p.z=gc.z+d.x*sa+d.z*ca;n=vec3(n.x*ca-n.z*sa,n.y,n.x*sa+n.z*ca);}
else if(gc.w<2.5){p.x=gc.x+d.x*ca-d.y*sa;p.y=gc.y+d.x*sa+d.y*ca;n=vec3(n.x*ca-n.y*sa,n.x*sa+n.y*ca,n.z);}
else{p.z=gc.z+d.z*ca-d.y*sa;p.y=gc.y+d.z*sa+d.y*ca;n=vec3(n.x,n.z*sa+n.y*ca,n.z*ca-n.y*sa);}
sway=0.0;}
if(flag==7.0){p.xz=mod(p.xz+uTime*uVel.xz-uFocus.xz+46.0,92.0)-46.0+uFocus.xz;p.y=mod(p.y+uTime*uVel.y,40.0)+2.0;}
else if(flag==8.0){float ph=iSz.z;float age=fract(uTime*0.3+ph);p+=vec3(sin(ph*44.0+uTime*0.7)*age*2.5+age*5.0,age*13.0,cos(ph*31.0+uTime*0.5)*age*2.5);S*=0.8-0.5*age;}
else if(flag==9.0){float ph=iSz.z;float dr=fract(ph*3.7)>0.5?1.0:-1.0;float a=uTime*0.5*dr+ph*6.2832;float wg=n.x;float R=iSz.x+wg*1.4;S=vec2(iSz.y);
p+=vec3(cos(a)*R,2.0*sin(uTime*0.9+ph*9.0)+abs(wg)*(sin(uTime*9.0+ph*20.0)>0.0?0.7:-0.4),sin(a)*R);}
if(flag==2.0){b=normalize(vec3(n.x*0.6,1.0,n.z*0.6));t=normalize(cross(b,V));}
else if(flag==5.0||(flag>=7.0&&flag<9.5)){t=normalize(cross(vec3(0.0,1.0,0.0),V));b=normalize(cross(V,t));}
else if(flag==6.0){b=normalize(n);t=normalize(cross(b,V));}
else{n=normalize(n+vec3(0.0,0.0001,0.0));if(dot(n,V)<0.0)n=-n;n=normalize(mix(n,V,0.35));vec3 r=abs(n.y)<0.95?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);t=normalize(cross(r,n));b=cross(n,t);float c=cos(iSz.z);float s=sin(iSz.z);vec3 t2=t*c+b*s;b=b*c-t*s;t=t2;}
vec3 w=p+t*aC.x*S.x+b*aC.y*S.y;
float ph2=uTime*1.6+p.x*0.31+p.z*0.27;
if(flag==5.0){w.y+=sway*1.5*sin(uTime*0.6+p.x*1.3);w.x+=sway*1.2*sin(uTime*0.4+p.z*1.7);}
else if(flag<5.0){float amt=sway*0.3*(flag==2.0?(aC.y*0.5+0.5):1.0);w.x+=amt*sin(ph2);w.z+=amt*0.6*cos(ph2*0.8);}
vW=w;gl_Position=proj(w);
vUV=aC;vCol=iCol;}`;
export const FS=`#version 300 es
precision highp float;
in vec2 vUV;in vec4 vCol;in vec3 vW;uniform float uTime;uniform float uFlash;uniform vec3 uFlashC;out vec4 o;
void main(){float r2=dot(vUV,vUV);if(r2>1.0)discard;float flag=floor(vCol.a*255.0+0.5);vec3 c=vCol.rgb;
if(flag==2.0)c*=mix(0.55,1.12,vUV.y*0.5+0.5);
else if(flag==4.0)c*=mix(0.78,1.1,vUV.y*0.5+0.5);
else if(flag==3.0){float s=sin(vW.x*0.9+vW.z*0.3+uTime*1.3+2.2*sin(vW.z*0.33+uTime*0.4));float m=0.5+0.5*sin(vW.x*0.17-vW.z*0.23+uTime*0.25);c+=vec3(0.14,0.22,0.2)*smoothstep(0.9,0.99,s)*m;}
else if(flag==0.0)c*=1.0-0.12*r2;
c=mix(c,uFlashC,uFlash);
o=vec4(c,(flag==1.0||flag>=8.0)?1.0:0.0);}`;
export const FA=`#version 300 es
precision highp float;
in vec2 vUV;in vec4 vCol;in vec3 vW;uniform float uTime;out vec4 o;
void main(){float flag=floor(vCol.a*255.0+0.5);float a;
if(flag==6.0){a=exp(-4.0*vUV.x*vUV.x)*(1.0-vUV.y*vUV.y)*(0.8+0.2*sin(uTime*0.5+vW.x));}
else if(flag==7.0){a=exp(-3.0*dot(vUV,vUV));}
else{a=exp(-3.5*dot(vUV,vUV))*(0.7+0.3*sin(uTime*2.0+vW.x*3.0+vW.z));}
o=vec4(vCol.rgb*a,0.0);}`;
export const SV=`#version 300 es
precision highp float;
layout(location=0) in vec2 aC;
uniform vec4 uCam;uniform vec3 uFocus;uniform float uScale;uniform float uW;uniform vec3 uPos;uniform vec2 uSize;uniform vec2 uOff;uniform float uFlip;uniform float uBias;uniform float uZoom;
${PROJ}
out vec2 vUV;
// (a sprite is sized in screen pixels: uZoom and the perspective at its feet scale it with the world around it)
void main(){vec4 P=proj(uPos);float k=uZoom/P.w;vec2 c=P.xy/P.w;float h=uW*0.5;vec2 px=floor(c*h+0.5)+uOff*k;
vec2 q=vec2(aC.x*0.5*uSize.x,(aC.y*0.5+0.5)*uSize.y);
float up=max(q.y+uOff.y,0.0)*uZoom/(h*uScale*uCam.z);
gl_Position=vec4((px+q*k)/h,P.z/P.w-up*uCam.w/110.0-uBias,1.0);
float u=aC.x*0.5+0.5;vUV=vec2(uFlip>0.5?1.0-u:u,0.5-aC.y*0.5);}`;
export const SF=`#version 300 es
precision highp float;
in vec2 vUV;uniform sampler2D uT;uniform vec4 uRect;uniform vec3 uTint;uniform float uSil;out vec4 o;
void main(){ivec2 q=ivec2(uRect.xy+clamp(vUV,0.0,0.9999)*uRect.zw);vec4 c=texelFetch(uT,q,0);if(c.a<0.5)discard;
if(uSil>0.5){ivec2 f=ivec2(gl_FragCoord.xy/uSil);if(((f.x+f.y)&1)==0)discard;o=vec4(0.13,0.17,0.34,1.0);}else o=vec4(c.rgb*uTint,1.0);}`;
export const DV=`#version 300 es
precision highp float;
layout(location=0) in vec2 aC;
uniform vec4 uCam;uniform vec3 uFocus;uniform float uScale;uniform vec3 uPos;uniform float uR;uniform float uB;
${PROJ}
out vec2 vUV;
void main(){vec4 P=proj(uPos+vec3(aC.x*uR,0.0,aC.y*uR));P.z-=uB*P.w;gl_Position=P;vUV=aC;}`;
export const DF=`#version 300 es
precision highp float;
in vec2 vUV;uniform vec4 uCol;uniform float uMode;out vec4 o;
void main(){float r=length(vUV);if(uMode<0.5){if(r>1.0)discard;o=vec4(uCol.rgb,1.0);}else{if(abs(r-0.78)>0.22)discard;o=vec4(uCol.rgb,1.0);}}`;
export const PV=`#version 300 es
out vec2 vUV;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
export const PF=`#version 300 es
precision highp float;
in vec2 vUV;uniform sampler2D uC;uniform sampler2D uD;uniform vec2 uPx;uniform vec3 uBg;uniform float uPix;uniform float uDim;uniform vec4 uFlash;out vec4 o;
const float B[16]=float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);
void main(){vec4 c=texture(uC,vUV);float d=texture(uD,vUV).r;vec2 q=vUV-0.5;vec3 col;
if(d>=0.99999){col=(uBg*(1.25-1.1*dot(q,q))+vec3(0.10,0.12,0.10)*(0.5-q.y))*(1.0-uDim)+c.rgb;}
else{float m=0.0;
m=max(m,texture(uD,vUV+vec2(uPx.x*1.5,0.0)).r-d);m=max(m,texture(uD,vUV-vec2(uPx.x*1.5,0.0)).r-d);
m=max(m,texture(uD,vUV+vec2(0.0,uPx.y*1.5)).r-d);m=max(m,texture(uD,vUV-vec2(0.0,uPx.y*1.5)).r-d);
float edge=smoothstep(0.004,0.010,m);
float occ=0.0;
for(int i=0;i<8;i++){float a=float(i)*0.7854+fract(sin(dot(vUV,vec2(12.9898,78.233)))*43758.5453)*0.7;float rad=(i%2==0)?4.0:9.0;
float df=(d-texture(uD,vUV+vec2(cos(a),sin(a))*uPx*rad).r)*220.0;occ+=clamp((df-0.25)/2.2,0.0,1.0)*step(df,7.0);}
col=c.rgb;
if(c.a<0.5)col*=(1.0-0.5*occ/8.0)*mix(1.0,0.5,edge);
col=pow(col,vec3(0.94))*(1.08-0.4*dot(q,q));}
col+=uFlash.rgb*uFlash.a;
if(uPix>0.5){ivec2 ip=ivec2(gl_FragCoord.xy)&3;col=floor(col*31.0+(B[ip.y*4+ip.x]+0.5)/16.0)/31.0;}
o=vec4(col,1.0);}`;
// Battle effects (engine/fx.js): instanced quads, added onto the picture. Each has two points (a streak runs from A to B;
// everything else sits at A), a size, a turn, a kind and a colour with its strength in alpha.
//   0 glow  1 star  2 streak  3 crystal (upright)  4 beam (upright)  5 ring (flat)  6 glyph (flat)  7 shock (facing)
export const XV=`#version 300 es
precision highp float;
layout(location=0) in vec2 aC;
layout(location=1) in vec3 iA;
layout(location=2) in vec3 iB;
layout(location=3) in vec4 iS;
layout(location=4) in vec4 iC;
uniform vec4 uCam;uniform vec3 uFocus;uniform float uScale;
${PROJ}
out vec2 vUV;out vec4 vCol;flat out int vK;
void main(){int k=int(iS.w+0.5);vUV=aC;vCol=iC;vK=k;
vec3 R=vec3(uCam.x,0.0,uCam.y);vec3 F=vec3(-uCam.y,0.0,uCam.x);vec3 U=vec3(0.0,uCam.z,0.0)+F*uCam.w;vec3 Y=vec3(0.0,1.0,0.0);
float c=cos(iS.z);float s=sin(iS.z);
if(k==2){vec4 a=proj(iA);vec4 b=proj(iB);vec2 pa=a.xy/a.w;vec2 pb=b.xy/b.w;vec2 d=pb-pa;float L=max(length(d),1e-4);vec2 n=vec2(-d.y,d.x)/L;
float th=iS.x*uScale*2.0/(a.w+b.w);vec2 p=mix(pa,pb,aC.y*0.5+0.5)+n*aC.x*th+d/L*aC.y*th;
gl_Position=vec4(p,mix(a.z/a.w,b.z/b.w,aC.y*0.5+0.5),1.0);return;}
vec3 w;
if(k==3||k==4){vec3 t=R*c+Y*s;vec3 b=Y*c-R*s;w=iA+t*aC.x*iS.x+b*(aC.y*0.5+0.5)*iS.y;}
else if(k==5||k==6){w=iA+vec3(aC.x*c-aC.y*s,0.0,aC.x*s+aC.y*c)*iS.x;}
else{vec3 t=R*c+U*s;vec3 b=U*c-R*s;w=iA+t*aC.x*iS.x+b*aC.y*iS.y;}
gl_Position=proj(w);}`;
export const XF=`#version 300 es
precision highp float;
in vec2 vUV;in vec4 vCol;flat in int vK;out vec4 o;
float band(float r,float at,float w){float x=(r-at)/w;return exp(-x*x);}
void main(){vec2 p=vUV;float r=length(p);float a=0.0;
if(vK==0)a=exp(-3.2*r*r);
else if(vK==1)a=max(exp(-70.0*p.x*p.x)*(1.0-abs(p.y)),exp(-70.0*p.y*p.y)*(1.0-abs(p.x)))+0.7*exp(-9.0*r*r);
else if(vK==2)a=exp(-4.5*p.x*p.x)*(1.0-smoothstep(0.55,1.0,abs(p.y)));
else if(vK==3){float y=p.y*0.5+0.5;float wd=y<0.8?0.55+0.45*y/0.8:(1.0-y)/0.2;float e=abs(p.x)/max(wd,1e-3);if(e>1.0)discard;
a=0.32+0.68*smoothstep(0.55,1.0,e)+0.6*exp(-60.0*p.x*p.x);}
else if(vK==4)a=exp(-4.0*p.x*p.x)*smoothstep(-1.0,-0.7,p.y)*(1.0-smoothstep(0.1,1.0,p.y));
else if(vK==5)a=band(r,0.82,0.1)+0.25*band(r,0.6,0.18);
else if(vK==6){float an=atan(p.y,p.x);a=band(r,0.95,0.035)+band(r,0.78,0.03);
if(r>0.8&&r<0.93)a+=0.8*step(0.55,fract(an*24.0/6.2832))*step(0.3,fract(an*3.0/6.2832+0.1));
if(r<0.78){float m=0.0;for(int i=0;i<6;i++){float b=float(i)*1.0472+0.5236;m=max(m,band(dot(p,vec2(cos(b),sin(b))),0.39,0.02));}a+=m;}
a+=0.35*exp(-6.0*r*r);}
else a=band(r,0.85,0.06)*0.9;
o=vec4(vCol.rgb*a*vCol.a,a*vCol.a>0.6?1.0:0.0);}`;
// darkens what is already drawn (Psynergy dims the scene behind its effect)
export const MF=`#version 300 es
precision highp float;
uniform float uK;out vec4 o;void main(){o=vec4(vec3(uK),1.0);}`;

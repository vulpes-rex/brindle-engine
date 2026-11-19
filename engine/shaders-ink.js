// GLSL for the "ink" look: Ink Studio's dabs projected as ellipses into a small buffer of who-is-in-front, then a port of its
// pixel stage (smoothed light, ramp or pattern colour, one-pixel cell edges, outlines, creases, light shafts, nearest palette
// colour) and of its clean-up pass.
export const OCT=`vec3 octDec(vec2 e){vec2 f=e*2.-1.;vec3 n=vec3(f.x,1.-abs(f.x)-abs(f.y),f.y);if(n.y<0.){n.xz=(1.-abs(n.zx))*vec2(n.x>=0.?1.:-1.,n.z>=0.?1.:-1.);}return normalize(n);}`;
export const VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aQ;layout(location=1) in vec4 aP;layout(location=2) in vec4 aA;layout(location=3) in vec4 aB;
uniform vec3 uEye,uCX,uCY,uCZ,uO;uniform vec2 uRes;uniform float uF,uNear,uFar,uQ,uSig,uThr;
flat out vec4 vG0;flat out vec4 vG1;flat out vec3 vK;out vec2 vD;
${OCT}
void main(){
  vec3 p=aP.xyz*uQ+uO-uEye,c=vec3(dot(uCX,p),dot(uCY,p),dot(uCZ,p));float zc=-c.z;
  if(zc<uNear){gl_Position=vec4(2.,2.,2.,1.);return;}
  vec3 n=octDec(aA.xy);float s2=aA.z*uSig;s2*=s2;
  float iz=1./zc,j0=uF*iz,j1=uF*c.x*iz*iz,j2=uF*c.y*iz*iz;
  vec3 a=j0*uCX+j1*uCZ,b=j0*uCY+j2*uCZ;float an=dot(a,n),bn=dot(b,n);
  float A=s2*(dot(a,a)-0.574896*an*an)+0.15,B=s2*(dot(a,b)-0.574896*an*bn),C=s2*(dot(b,b)-0.574896*bn*bn)+0.15;
  vK=vec3(C,-B,A)/(A*C-B*B);
  vD=aQ*(sqrt(uThr*vec2(A,C))+0.5);
  vec2 s=uF*c.xy*iz+0.5*uRes;
  gl_Position=vec4((s+vD)/(0.5*uRes)-1.,2.*(zc-uNear)/(uFar-uNear)-1.,1.);
  float row=aP.w,hi=floor(row/256.);
  vG0=vec4((row-hi*256.)/255.,hi/255.,aA.w,aB.x);vG1=vec4(aA.x,aA.y,aB.y,aB.z);
}`;
export const FS=`#version 300 es
precision highp float;
flat in vec4 vG0;flat in vec4 vG1;flat in vec3 vK;in vec2 vD;
layout(location=0) out vec4 o0;layout(location=1) out vec4 o1;uniform float uThr;
void main(){float q=vK.x*vD.x*vD.x+vK.z*vD.y*vD.y+2.*vK.y*vD.x*vD.y;if(q>uThr)discard;o0=vG0;o1=vG1;}`;
export const QV=`#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;
export const PA=`#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D uG0,uG1,uD,uLUT,uRamp,uPal;
uniform vec2 uRes;uniform vec3 uEye,uCX,uCY,uCZ,uLan;
uniform float uF,uNear,uFar,uDist,uRad,uT,uBeamA,uBeam,uWaterY,uCell,uLeaf,uLitMax;
uniform int uNP;
out vec4 o;
${OCT}
ivec2 RS;
const int RM[4]=int[4](14,108,7,22);
const int LM[4]=int[4](2274,4812,10692,5312);
bool oob(ivec2 q){return q.x<0||q.y<0||q.x>=RS.x||q.y>=RS.y;}
int b8(float v){return int(v*255.+.5);}
int lutAt(int row,int e){vec3 t=texelFetch(uLUT,ivec2(e/3,row),0).rgb;int c=e-3*(e/3);return b8(c==0?t.r:c==1?t.g:t.b);}
int rampAt(int rid,int k){return b8(texelFetch(uRamp,ivec2(k+1,rid-1),0).r);}
int rampLen(int rid){return b8(texelFetch(uRamp,ivec2(0,rid-1),0).r);}
int keyAt(ivec2 q){if(oob(q))return 0;vec4 g=texelFetch(uG1,q,0);return b8(g.b)+256*b8(g.a);}
uint hsh(int i,int j,int k,int s){uint h=uint(i)*374761393u+uint(j)*668265263u+uint(k)*1440662683u+uint(s)*1274126177u;h=(h^(h>>13))*1274126177u;h^=h>>16;h*=2246822519u;h^=h>>13;return h;}
float hf(int i,int j,int k,int s){return float(hsh(i,j,k,s)>>8)/16777216.;}
float inCyl(vec3 ro,vec3 rd,float stop,vec3 A,vec3 B,float rad){
  vec3 ax=B-A;float h=length(ax);ax/=h;vec3 dl=ro-A;float p=dot(dl,ax),dd=dot(rd,ax),t0=0.,t1=stop;
  if(abs(dd)<1e-6){if(!(p>0.&&p<h))return 0.;}else{float a=-p/dd,b=(h-p)/dd;t0=max(t0,min(a,b));t1=min(t1,max(a,b));if(t1<=t0)return 0.;}
  float qa=1.-dd*dd,qb=dot(dl,rd)-p*dd,qc=dot(dl,dl)-p*p-rad*rad;
  if(qa<1e-6){if(!(qc<0.))return 0.;}else{float D=qb*qb-qa*qc;if(D<=0.)return 0.;float w=sqrt(D);t0=max(t0,(-qb-w)/qa);t1=min(t1,(-qb+w)/qa);if(t1<=t0)return 0.;}
  return t1-t0;}
float inSph(vec3 ro,vec3 rd,float stop,vec3 C,float rad){vec3 dl=ro-C;float b=dot(dl,rd),c=dot(dl,dl)-rad*rad,D=b*b-c;if(D<=0.)return 0.;float w=sqrt(D),t0=max(0.,-b-w),t1=min(stop,-b+w);return max(0.,t1-t0);}
void main(){
  RS=ivec2(uRes);ivec2 P=ivec2(gl_FragCoord.xy);
  float d0=texelFetch(uD,P,0).r,zr=uFar-uNear,z0=uNear+d0*zr;bool hit=d0<0.99999;
  vec2 v=(gl_FragCoord.xy-0.5*uRes)/uF;vec3 du=uCX*v.x+uCY*v.y-uCZ;float dl=length(du);
  int ci=0;
  if(hit){
    vec4 g0=texelFetch(uG0,P,0),g1=texelFetch(uG1,P,0);
    int rf=b8(g0.a),rid=rf&31,fl=rf>>5,row=b8(g0.r)+256*b8(g0.g);
    if(rid==0)ci=lutAt(row,0);
    else{
      vec3 n0=octDec(g1.rg);float l0=g0.b,sum=0.,cnt=0.,s7=0.,c7=0.;
      for(int dy=-3;dy<=3;dy++)for(int dx=-3;dx<=3;dx++){
        bool inner=abs(dx)<=1&&abs(dy)<=1,chk=((dx+dy)&1)==0;if(!inner&&!chk)continue;
        ivec2 q=P+ivec2(dx,dy);if(oob(q))continue;
        float dq=texelFetch(uD,q,0).r;if(dq>=0.99999)continue;
        vec4 h0=texelFetch(uG0,q,0);if((b8(h0.a)&31)!=rid)continue;
        float dd=abs(dq-d0)*zr;
        if(inner&&dd<=0.14){sum+=h0.b;cnt+=1.;}
        if(chk&&dd<=0.42&&dot(n0,octDec(texelFetch(uG1,q,0).rg))>=0.8){s7+=h0.b;c7+=1.;}
      }
      float lit=sum/max(cnt,1.);
      if(c7>0.){float k=clamp((c7/25.-0.5)/0.35,0.,1.);lit+=(s7/c7-lit)*k*k*(3.-2.*k);}
      lit*=uLitMax;
      int lv=clamp(int(floor(lit*60.)),0,59),var=0,key=b8(g1.b)+256*b8(g1.a);
      if(key!=0){int kb=keyAt(P+ivec2(0,-1)),kl=keyAt(P+ivec2(-1,0)),ka=keyAt(P+ivec2(0,1));
        if(kb!=0&&kb!=key)var=1;else if(kl!=0&&kl!=key)var=3;else if(ka!=0&&ka!=key)var=2;}
      ci=lutAt(row,var*60+lv);
      int len=rampLen(rid);
      // leaf marks: a little upright picture of leaves on some clusters of a crown, a step darker in the light, a step lighter in shade
      if((fl&1)!=0){
        vec3 wp=uEye+du*z0;ivec3 g=ivec3(floor(wp/uLeaf));int best=-9;
        for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
          int A=g.x+i,B=g.y+j,C=g.z+k;if(hf(A,B,C,34)>0.3)continue;
          vec3 qv=(vec3(float(A),float(B),float(C))+0.15+0.7*vec3(hf(A,B,C,29),hf(A,B,C,30),hf(A,B,C,31)))*uLeaf,dq=qv-wp;if(dot(dq,dq)>uLeaf*uLeaf*1.5)continue;
          vec3 ap=qv-uEye;float az=-dot(uCZ,ap);if(az<uNear)continue;
          vec2 sc=uF*vec2(dot(uCX,ap),dot(uCY,ap))/az+0.5*uRes-0.5;
          int ox=int(floor(float(P.x)-sc.x+0.5)),oy=int(floor(float(P.y)-sc.y+0.5));
          if(abs(ox)>2||oy<0||oy>2||oy<=best)continue;
          if(((LM[int(hf(A,B,C,35)*4.)&3]>>(oy*5+ox+2))&1)==0)continue;
          best=oy;}
        if(best>=0){int b=-1;for(int k=0;k<len;k++)if(rampAt(rid,k)==ci){b=k;break;}
          if(b>=0)ci=rampAt(rid,clamp(b*2>=len?b-1:b+1,0,len-1));}
      }
      // ripples: short strokes of light, upright on the picture, pinned to points on the water, each showing for part of its beat
      if((fl&2)!=0&&du.y<-1e-4){
        float s=(uWaterY-uEye.y)/du.y;vec3 wp=uEye+du*s;int ix=int(floor(wp.x/uCell)),iz=int(floor(wp.z/uCell));bool rip=false;
        for(int k=-1;k<=1&&!rip;k++)for(int i=-1;i<=1;i++){
          int a=ix+i,c=iz+k;if(hf(a,c,4,19)>0.35)continue;
          float ph=uT*0.6+hf(a,c,7,19);if(ph-floor(ph)>0.6)continue;
          vec3 ap=vec3((float(a)+0.15+0.7*hf(a,c,0,19))*uCell,uWaterY,(float(c)+0.15+0.7*hf(a,c,1,19))*uCell)-uEye;
          float az=-dot(uCZ,ap);if(az<uNear)continue;
          vec2 sc=uF*vec2(dot(uCX,ap),dot(uCY,ap))/az+0.5*uRes-0.5;
          int ox=int(floor(float(P.x)-sc.x+0.5)),oy=int(floor(float(P.y)-sc.y+0.5));
          if(abs(ox)>2||oy<0||oy>1)continue;
          int m=RM[int(hf(a,c,6,19)*4.)&3];
          if(((m>>(oy*5+ox+2))&1)!=0){rip=true;break;}
        }
        if(rip)ci=rampAt(rid,min(clamp(int(floor(lit*float(len))),0,len-1)+2,len-1));
      }
      // outline and crease
      bool edge=false,sky=false;int crease=0;
      const ivec2 N4[4]=ivec2[4](ivec2(-1,0),ivec2(1,0),ivec2(0,-1),ivec2(0,1));
      for(int a=0;a<4;a++){ivec2 q=P+N4[a];if(oob(q))continue;
        float dq=texelFetch(uD,q,0).r;bool hq=dq<0.99999;float dd=hq?(dq-d0)*zr:1e3;if(dd<=0.01765)continue;
        if(!hq||(b8(texelFetch(uG0,q,0).a)&31)!=rid||dd>0.3){edge=true;sky=!hq;break;}}
      if(!edge&&(fl&1)==0)for(int a=0;a<4;a++){ivec2 q=P+N4[a];if(oob(q))continue;
        float dq=texelFetch(uD,q,0).r;if(dq>=0.99999)continue;vec4 h0=texelFetch(uG0,q,0);
        if((b8(h0.a)&31)!=rid||abs(dq-d0)*zr>0.3)continue;
        if(dot(n0,octDec(texelFetch(uG1,q,0).rg))>0.7)continue;
        crease=l0>=h0.b?1:-1;break;}
      if(edge||crease!=0){int b=-1;for(int k=0;k<len;k++)if(rampAt(rid,k)==ci){b=k;break;}
        if(b>=0){int k2=b*2>=len?(sky?1:0):2;ci=rampAt(rid,clamp(edge?b-k2:b+crease,0,len-1));}}
    }
  }
  vec3 col=texelFetch(uPal,ivec2(ci,0),0).rgb;
  if(uBeam>0.5){
    vec3 rd=du/dl;float stop=(hit?z0:uDist+2.*uRad)*dl,tau=0.6*inSph(uEye,rd,stop,uLan,0.5);
    for(int k=0;k<2;k++){float a=uBeamA+float(k)*3.14159265;vec3 ax=vec3(cos(a),-0.09,sin(a));
      tau+=1.5*inCyl(uEye,rd,stop,uLan+ax*0.25,uLan+ax*1.5,0.11)+0.75*inCyl(uEye,rd,stop,uLan+ax*1.5,uLan+ax*2.8,0.16)+0.36*inCyl(uEye,rd,stop,uLan+ax*2.8,uLan+ax*4.0,0.21);}
    if(tau>0.){col=mix(col,vec3(1.,0.847,0.451),1.-exp(-tau));
      float bd=1e9;vec3 bc=col;for(int i=0;i<uNP;i++){vec3 e=texelFetch(uPal,ivec2(i,0),0).rgb,df=col-e;float dd=dot(df*df,vec3(0.3,0.55,0.15));if(dd<bd){bd=dd;bc=e;}}
      col=bc;}
  }
  o=vec4(col,hit?min(0.98,clamp((z0-(uDist-uRad))/(2.*uRad),0.,1.)):1.);
}`;
export const PC=`#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D uC;uniform vec2 uRes;out vec4 o;
ivec2 RS,P;
vec4 S(int dx,int dy){return texelFetch(uC,clamp(P+ivec2(dx,-dy),ivec2(0),RS-1),0);}
bool same(vec4 a,vec4 b){return a.rgb==b.rgb;}
float lum(vec4 a){return dot(a.rgb,vec3(0.3,0.55,0.15));}
bool emp(vec4 a){return a.a>0.99;}
void main(){
  RS=ivec2(uRes);P=ivec2(gl_FragCoord.xy);
  const ivec2 N8[8]=ivec2[8](ivec2(-1,0),ivec2(1,0),ivec2(0,-1),ivec2(0,1),ivec2(-1,-1),ivec2(1,-1),ivec2(-1,1),ivec2(1,1));
  vec4 q=S(0,0),nb[8];for(int i=0;i<8;i++)nb[i]=S(N8[i].x,N8[i].y);
  bool e0=emp(q),done=false;int en=0;for(int i=0;i<4;i++)if(emp(nb[i]))en++;
  vec4 oc=q;
  if(e0&&en<=1){int kb=0,best=-1;for(int i=0;i<4;i++){if(emp(nb[i]))continue;int k=0;for(int j=0;j<4;j++)if(same(nb[i],nb[j]))k++;if(k>kb){kb=k;best=i;}}
    if(best>=0){oc=nb[best];done=true;}}
  if(!done&&!e0&&en>=3){for(int i=0;i<4;i++)if(emp(nb[i])){oc=nb[i];done=true;break;}}
  if(!done){
    for(int i=0;i<4;i++){ivec2 d=N8[i],e=ivec2(d.y,d.x);vec4 X=nb[i];
      if(same(X,q)||!same(S(e.x,e.y),X)||!same(S(-e.x,-e.y),X))continue;
      if(same(S(-d.x,-d.y),q)&&same(S(-d.x+e.x,-d.y+e.y),q)&&same(S(-d.x-e.x,-d.y-e.y),q)){oc=X;done=true;break;}}
    if(!done){float l0=lum(q)*255.;
      for(int i=4;i<8;i++){ivec2 g=N8[i];
        if(!same(S(g.x,0),q)||!same(S(0,g.y),q)||same(S(g.x,g.y),q)||same(S(-g.x,0),q)||same(S(0,-g.y),q))continue;
        bool goH=same(S(2*g.x,0),q)||same(S(2*g.x,-g.y),q),goV=same(S(0,2*g.y),q)||same(S(-g.x,2*g.y),q);
        vec4 a=S(-g.x,0),b=S(0,-g.y);
        if(goH&&goV&&lum(a)*255.>l0+15.&&lum(b)*255.>l0+15.){oc=same(a,b)?a:S(-g.x,-g.y);done=true;break;}}}
  }
  if(!done){int n=0,one=0;for(int i=0;i<8;i++)if(same(nb[i],q)){n++;one=i;}
    bool lone=n==0;
    if(n==1){ivec2 c=N8[one];int m=0;for(int j=0;j<8;j++)if(same(S(c.x+N8[j].x,c.y+N8[j].y),q))m++;lone=m==1;}
    if(lone){int kb=0,best=-1;for(int i=0;i<8;i++){if(same(nb[i],q))continue;int k=0;for(int j=0;j<8;j++)if(same(nb[i],nb[j]))k++;if(k>kb){kb=k;best=i;}}
      if(best>=0&&kb>=3&&abs(q.a-nb[best].a)<=0.03&&abs(lum(q)-lum(nb[best]))<0.3)oc=nb[best];}}
  o=vec4(oc.rgb,1.);
}`;

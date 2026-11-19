// Sorts a generated scene's splats into a grid of tiles (plus one always-drawn bin) so the renderer can skip tiles off screen.
// Self-contained: it is also handed to the generator's Web Worker as text.
export function binTiles(r,T,C){const TS=2*C/T,n=r.n,st=new Uint32Array(T*T+2),idx=new Uint8Array(n),F0=r.F,N0=r.NB,C0=r.CB;
const yr=new Float32Array(T*T*2);for(let k=0;k<T*T;k++){yr[k*2]=1e9;yr[k*2+1]=-1e9;}
for(let i=0;i<n;i++){let k;if(C0[i*4+3]>=8||N0[i*4+3]<0)k=T*T;else{let tx=Math.floor((F0[i*6]+C)/TS),tz=Math.floor((F0[i*6+2]+C)/TS);tx=tx<0?0:tx>=T?T-1:tx;tz=tz<0?0:tz>=T?T-1:tz;k=tz*T+tx;const y=F0[i*6+1];if(y<yr[k*2])yr[k*2]=y;if(y>yr[k*2+1])yr[k*2+1]=y;}idx[i]=k;st[k+1]++;}
for(let k=0;k<=T*T;k++)st[k+1]+=st[k];
const at=st.slice(),F=new Float32Array(n*6),NB=new Int8Array(n*4),CB=new Uint8Array(n*4);
for(let i=0;i<n;i++){const o=at[idx[i]]++,a=i*6,b=o*6,c=i*4,d=o*4;F[b]=F0[a];F[b+1]=F0[a+1];F[b+2]=F0[a+2];F[b+3]=F0[a+3];F[b+4]=F0[a+4];F[b+5]=F0[a+5];
NB[d]=N0[c];NB[d+1]=N0[c+1];NB[d+2]=N0[c+2];NB[d+3]=N0[c+3];CB[d]=C0[c];CB[d+1]=C0[c+1];CB[d+2]=C0[c+2];CB[d+3]=C0[c+3];}
r.F=F;r.NB=NB;r.CB=CB;r.tiles=st;r.T=T;r.yr=yr;return r;}

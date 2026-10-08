import numpy as np, wave
SR=48000; rng=np.random.default_rng(7)
def save(name,x):
    x=np.clip(x,-1,1); w=wave.open('wav/'+name+'.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x*32767).astype('<i2').tobytes()); w.close()
def biquad(x,b,a):
    y=np.zeros_like(x); x1=x2=y1=y2=0.0
    b0,b1,b2=b; a1,a2=a[1],a[2]
    for i in range(len(x)):
        v=b0*x[i]+b1*x1+b2*x2-a1*y1-a2*y2; x2,x1=x1,x[i]; y2,y1=y1,v; y[i]=v
    return y
def lp(x,f,q=0.707):
    w=2*np.pi*f/SR; al=np.sin(w)/(2*q); c=np.cos(w); a0=1+al
    return biquad(x,[(1-c)/2/a0,(1-c)/a0,(1-c)/2/a0],[1,-2*c/a0,(1-al)/a0])
def bp(x,f,q):
    w=2*np.pi*f/SR; al=np.sin(w)/(2*q); c=np.cos(w); a0=1+al
    return biquad(x,[al/a0,0,-al/a0],[1,-2*c/a0,(1-al)/a0])
def hp(x,f,q=0.707):
    w=2*np.pi*f/SR; al=np.sin(w)/(2*q); c=np.cos(w); a0=1+al
    return biquad(x,[(1+c)/2/a0,-(1+c)/a0,(1+c)/2/a0],[1,-2*c/a0,(1-al)/a0])
def db(x): return 20*np.log10(np.sqrt(np.mean(x**2))+1e-12)
def norm(x,dbfs): return x*10**((dbfs-db(x))/20)
def pink(n):
    w=rng.standard_normal(n); f=np.fft.rfft(w); k=np.arange(len(f)); k[0]=1; return np.fft.irfft(f/np.sqrt(k),n)
def env_seg(n,att=0.05,rel=0.15):
    e=np.ones(n); a=int(att*SR); r=int(rel*SR); e[:a]=np.linspace(0,1,a); e[-r:]=np.linspace(1,0,r); return e
def wind(n,gust=True):
    x=lp(lp(rng.standard_normal(n),220),400)+0.05*hp(rng.standard_normal(n),1500)
    if gust:
        m=lp(rng.standard_normal(n),5)
        m=(m-m.min())/(m.max()-m.min()); x*=0.45+0.55*m
    return x*env_seg(n,0.12,0.25)
def voice(n,f0=140):
    t=np.arange(n)/SR
    pitch=f0*(1+0.15*np.sin(2*np.pi*0.7*t)+0.03*lp(rng.standard_normal(n),20)*20)
    ph=np.cumsum(pitch/SR); src=(ph%1.0)*2-1; src=src-lp(src,60)  # sawtooth glottal
    vowels=[(730,1090,2440),(270,2290,3010),(300,870,2240),(530,1840,2480)]
    out=np.zeros(n); seg=int(0.22*SR)
    for s in range(0,n,seg):
        f1,f2,f3=vowels[(s//seg)%4]; chunk=src[s:s+seg]
        y=bp(chunk,f1,6)+0.6*bp(chunk,f2,8)+0.3*bp(chunk,f3,10)
        out[s:s+len(y)]=y*np.hanning(len(y))**0.6
    # fricatives and plosives
    for k in range(int(n/SR*1.5)):
        p=rng.integers(0,n-int(0.15*SR))
        if k%2==0: out[p:p+int(0.12*SR)]+=hp(rng.standard_normal(int(0.12*SR)),4000)*0.25*np.hanning(int(0.12*SR))
        else:
            L=int(0.035*SR); out[p:p+L]+=lp(rng.standard_normal(L),300)*3*np.exp(-np.arange(L)/(0.008*SR))
    return out
def taps(n):
    x=np.zeros(n)
    for p in [0.2,0.7,1.1,1.6,2.0]:
        i=int(p*SR); L=int(0.06*SR); t=np.arange(L)/SR
        x[i:i+L]+=np.sin(2*np.pi*90*t)*np.exp(-t/0.012)+0.3*rng.standard_normal(L)*np.exp(-t/0.003)
    return x
def scene(ambient, event, ev_db, name, pre=2.5, dur=2.5, post=3.0):
    N=int((pre+dur+post)*SR); amb=np.zeros(N)
    if ambient=='quiet': amb=norm(pink(N),-58)+norm(rng.standard_normal(N),-66)
    if ambient=='cafe':
        b=sum(voice(N,f0) for f0 in (110,130,190,220)); amb=norm(b,-38)+norm(pink(N),-42)
    ev=np.zeros(N)
    if event:
        L=int(dur*SR); e={'blow':wind(L),'talk':voice(L,150),'tap':taps(L)}[event]
        ev[int(pre*SR):int(pre*SR)+L]=norm(e,ev_db)
    save(name, amb+ev)
# levels in dBFS RMS. Real close blows into a phone mic are very loud (often clipping); speech at ~20cm ~ -25..-20 dBFS
scene('quiet',None,0,'quiet')
scene('cafe',None,0,'cafe')
for amb in ('quiet','cafe'):
    scene(amb,'blow',-12,f'{amb}_blow_strong')
    scene(amb,'blow',-22,f'{amb}_blow_medium')
    scene(amb,'blow',-30,f'{amb}_blow_weak')
    scene(amb,'talk',-20,f'{amb}_talk_loud')
    scene(amb,'tap',-20,f'{amb}_tap')
scene('quiet','talk',-14,'quiet_talk_veryloud')
# calibration: 2.6s quiet then 3.4s medium blow then 2s quiet
scene('quiet','blow',-22,'calib',pre=2.6,dur=3.4,post=2.0)
print('ok')

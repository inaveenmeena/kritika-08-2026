import{useCallback,useEffect,useMemo,useRef,useState}from'react';
import{AnimatePresence,motion,useAnimation,useMotionValue,useSpring,useTransform}from'motion/react';
import confetti from'canvas-confetti';

const letters=[
 {c:'K',word:'Kind',line:'even when nobody is watching',color:'#ffcf3f',ink:'#352108'},
 {c:'R',word:'Resilient',line:'far beyond what you realise',color:'#ff688f',ink:'#3c1020'},
 {c:'I',word:'Intelligent',line:'curious, thoughtful, always growing',color:'#66d6c3',ink:'#073c34'},
 {c:'T',word:'Tenacious',line:'especially when life gets difficult',color:'#8e7dff',ink:'#171039'},
 {c:'I',word:'Irreplaceable',line:'to every life you make brighter',color:'#ff8c42',ink:'#3b1a08'},
 {c:'K',word:'Kritika',line:'completely, wonderfully one of one',color:'#70c8ff',ink:'#08283d'},
 {c:'A',word:'Absolutely loved',line:'by your Surajmukhi',color:'#f64b7f',ink:'#fff8ec'}
];
const chaosWords=['BAD DAY','DISTANCE','WHAT IF?','DOUBT','EXAMS','OVERTHINKING'];

type Pos={x:number,y:number};

function Letter({item,index,total,onMove,onDiscover,chaos}:{item:typeof letters[number],index:number,total:number,onMove:(i:number,p:Pos)=>void,onDiscover:(i:number)=>void,chaos:number}){
 const controls=useAnimation();const x=useMotionValue(0),y=useMotionValue(0);const rotate=useTransform(x,[-500,0,500],[-24,0,24]);
 const home=useMemo(()=>({x:0,y:0}),[]);
 useEffect(()=>{if(!chaos)return;const angle=(index/total)*Math.PI*2+Math.random();controls.start({x:Math.cos(angle)*(130+Math.random()*220),y:Math.sin(angle)*(100+Math.random()*180),rotate:(Math.random()-.5)*130,transition:{type:'spring',stiffness:70,damping:9}}).then(()=>controls.start({...home,rotate:0,transition:{type:'spring',stiffness:95+(index%3)*18,damping:11,mass:.8+index*.05}}))},[chaos,controls,home,index,total]);
 const letterStyle={'--letter':item.color,'--letter-ink':item.ink,x,y,rotate} as never;
 return <motion.button className="letter" style={letterStyle} drag dragElastic={.08} dragMomentum onDrag={(_,info)=>onMove(index,{x:info.offset.x,y:info.offset.y})} onDragEnd={(_,info)=>{onMove(index,{x:0,y:0});controls.start({x:0,y:0,rotate:0,transition:{type:'spring',stiffness:105+(index%3)*18,damping:9+index*.5,velocity:Math.hypot(info.velocity.x,info.velocity.y)/900}})}} animate={controls} whileHover={{y:-10,scale:1.035}} whileTap={{scale:.94}} onClick={()=>onDiscover(index)} aria-label={`${item.c}: ${item.word}`}>
   <span>{item.c}</span><i>{index+1}</i>
 </motion.button>
}

function Sunflower({bloom,onBloom}:{bloom:boolean,onBloom:()=>void}){return <motion.button className={'sunflower '+(bloom?'bloom':'')} onClick={onBloom} whileHover={{scale:1.08,rotate:3}} whileTap={{scale:.9}} aria-label="Bloom the sunflower"><span className="petals">{Array.from({length:14},(_,i)=><i key={i} style={{'--r':`${i*25.7}deg`} as React.CSSProperties}/>)}</span><b></b><em></em></motion.button>}

export default function App(){
 const[entered,setEntered]=useState(false),[positions,setPositions]=useState<Pos[]>(letters.map(()=>({x:0,y:0}))),[selected,setSelected]=useState<number|null>(null),[seen,setSeen]=useState(new Set<number>()),[chaos,setChaos]=useState(0),[objects,setObjects]=useState<{id:number,label:string,x:number}[]>([]),[night,setNight]=useState(false),[bloom,setBloom]=useState(false),[finale,setFinale]=useState(false),[cauli,setCauli]=useState(0);
 const stage=useRef<HTMLDivElement>(null);const progress=Math.min(100,(seen.size*11)+(chaos?12:0)+(bloom?11:0)+(cauli?8:0));
 const move=useCallback((i:number,p:Pos)=>setPositions(v=>v.map((a,n)=>n===i?p:a)),[]);
 const discover=(i:number)=>{setSelected(i);setSeen(v=>new Set(v).add(i))};
 const makeChaos=()=>{setChaos(v=>v+1);setObjects(chaosWords.map((label,i)=>({id:Date.now()+i,label,x:8+Math.random()*78})));setTimeout(()=>setObjects([]),3600)};
 const doBloom=()=>{setBloom(true);setTimeout(()=>{confetti({particleCount:70,spread:85,origin:{x:.84,y:.8},colors:['#ffd33f','#ff668f','#66d6c3'],disableForReducedMotion:true})},300)};
 const reveal=()=>{setFinale(true);confetti({particleCount:180,spread:130,startVelocity:48,origin:{y:.65},colors:['#ffcf3f','#ff5f8f','#66d6c3','#8e7dff','#fff4df'],disableForReducedMotion:true})};
 const connectors=positions.slice(0,-1).map((p,i)=>({x1:`${(i+.5)/7*100}%`,x2:`${(i+1.5)/7*100}%`,y1:`calc(50% + ${p.y*.22}px)`,y2:`calc(50% + ${positions[i+1].y*.22}px)`}));

 return <main className={night?'night':''}>
  <div className="noise"/><div className="orb o1"/><div className="orb o2"/>
  <AnimatePresence>{!entered&&<motion.section className="intro" exit={{clipPath:'circle(0% at 50% 50%)'}} transition={{duration:.8,ease:[.85,0,.15,1]}}><div className="intro-flower">✦</div><small>A LITTLE SOMETHING FOR</small><h1>KRITIKA</h1><p>Life has tried pulling you in every direction.<br/>There’s something I want you to remember.</p><motion.button onClick={()=>setEntered(true)} whileHover={{scale:1.04}} whileTap={{scale:.96}}>OPEN IT <span>↗</span></motion.button><i>26 · 08 · 2026</i></motion.section>}</AnimatePresence>

  <header><div className="brand">FOR <b>KRITIKA</b> <span>✿</span></div><div className="date">THREE YEARS · ONE OF ONE</div><button className="night-toggle" onClick={()=>setNight(v=>!v)}>{night?'LIGHT':'HORROR'} MODE</button></header>

  <section className="hero" ref={stage}>
   <div className="kicker">GO ON, TRY PULLING HER APART</div>
   <div className="word-stage">
    <svg className="threads">{connectors.map((l,i)=><line key={i} x1={l.x1} x2={l.x2} y1={l.y1} y2={l.y2}/>)}</svg>
    <div className="letters">{letters.map((l,i)=><Letter key={i} item={l} index={i} total={7} onMove={move} onDiscover={discover} chaos={chaos}/>)}</div>
    <AnimatePresence>{objects.map(o=><motion.div className="chaos-object" key={o.id} style={{left:`${o.x}%`}} initial={{y:-180,rotate:-20,opacity:0}} animate={{y:[-180,innerHeight*.45,innerHeight*.32],rotate:[-20,18,-8],opacity:[0,1,1]}} exit={{y:innerHeight,opacity:0}} transition={{duration:2.7,ease:[.2,.8,.2,1]}}>{o.label}</motion.div>)}</AnimatePresence>
   </div>
   <p className="promise">No matter how far life pulls you,<br/><em>you always find your way back to yourself.</em></p>
  </section>

  <nav className="playbar">
   <button onClick={makeChaos}><i>01</i><b>ADD A LITTLE CHAOS</b><span>↗</span></button>
   <button onClick={()=>setCauli(v=>v+1)}><i>02</i><b>SUSPICIOUS FLOWER</b><span>↗</span></button>
   <button onClick={()=>setNight(v=>!v)}><i>03</i><b>FACE A GHOST</b><span>↗</span></button>
  </nav>

  <AnimatePresence>{cauli>0&&<motion.button className="cauliflower" initial={{x:'120vw',rotate:220}} animate={{x:0,rotate:-8}} exit={{x:'-120vw',rotate:-200}} transition={{type:'spring',stiffness:90,damping:12}} onClick={()=>setCauli(0)}><span>🥦</span><b>STILL TECHNICALLY<br/>A FLOWER.</b><i>I stand by it.</i></motion.button>}</AnimatePresence>
  <AnimatePresence>{night&&<motion.div className="ghost" initial={{y:200,opacity:0}} animate={{y:[200,0,12],opacity:1}} exit={{x:'110vw',rotate:30}} onClick={()=>setNight(false)}><span>👻</span><b>oh no.<br/>it's Kritika.</b></motion.div>}</AnimatePresence>

  <Sunflower bloom={bloom} onBloom={doBloom}/>

  <AnimatePresence>{selected!==null&&<motion.aside className="compliment" initial={{opacity:0,y:50,rotate:4}} animate={{opacity:1,y:0,rotate:-2}} exit={{opacity:0,y:30}} onClick={()=>setSelected(null)}><small>{letters[selected].c} IS FOR</small><strong>{letters[selected].word}</strong><p>{letters[selected].line}.</p><span>TAP TO CLOSE</span></motion.aside>}</AnimatePresence>

  <div className="discovery"><div><span style={{width:`${progress}%`}}/></div><small>{progress<70?'KEEP PLAYING — THERE’S MORE':"YOU'VE FOUND ENOUGH"}</small>{progress>=55&&<motion.button initial={{opacity:0}} animate={{opacity:1}} onClick={reveal}>ONE MORE THING →</motion.button>}</div>

  <AnimatePresence>{finale&&<motion.section className="finale" initial={{clipPath:'circle(0% at 50% 65%)'}} animate={{clipPath:'circle(145% at 50% 65%)'}} exit={{clipPath:'circle(0% at 50% 65%)'}} transition={{duration:1.15,ease:[.76,0,.24,1]}}>
    <button className="close-final" onClick={()=>setFinale(false)}>BACK TO PLAYING ×</button><small>26 AUGUST 2026 · THREE YEARS OF US</small><h2>Happy Anniversary,<br/><em>Kritika.</em></h2><p>No matter what life throws at you, I hope you always remember how strong you are.</p><p>And whenever pulling yourself together feels too hard, you don’t have to do it alone.</p><div className="signature">I love you, Lado.<br/><b>Your Surajmukhi</b> 🌻</div><div className="final-word">KRITIKA</div>
  </motion.section>}</AnimatePresence>
 </main>
}

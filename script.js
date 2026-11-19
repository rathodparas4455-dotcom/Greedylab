const $=s=>document.querySelector(s);
const state={steps:[],i:0,running:false,timer:null};
const info={
 activity:{title:"Activity Selection",desc:"Select the maximum number of non-overlapping activities. Greedy rule: choose the activity with the earliest finish time."},
 knapsack:{title:"Fractional Knapsack",desc:"Maximize profit when fractions of items are allowed. Greedy rule: choose the highest profit/weight ratio."},
 jobs:{title:"Job Sequencing",desc:"Schedule jobs before deadlines for maximum profit. Greedy rule: consider highest-profit jobs first and place each as late as possible."},
 coin:{title:"Coin Change (Greedy)",desc:"For canonical coin systems, repeatedly take the largest coin that does not exceed the remaining amount."},
 prim:{title:"Prim's MST",desc:"Grow a minimum spanning tree by repeatedly taking the minimum edge connecting the tree to an unvisited vertex."},
 kruskal:{title:"Kruskal's MST",desc:"Sort edges by weight and add the smallest edge that does not form a cycle."},
 dijkstra:{title:"Dijkstra",desc:"Find shortest paths from one source in a graph with non-negative edge weights."},
 huffman:{title:"Huffman Coding",desc:"Repeatedly combine the two least frequent symbols to build an optimal prefix code."}
};
const configs={
 activity:`<div class="fieldrow"><label>Activities as start-finish pairs:</label><input id="actInput" value="1-2,3-4,0-6,5-7,8-9,5-9"></div><div class="input-help">Example: 1-2,3-4,0-6,5-7</div>`,
 knapsack:`<div class="fieldrow"><label>Capacity:</label><input id="capacity" type="number" value="50"><label>Items (profit,weight):</label><input id="items" value="60-10,100-20,120-30"></div>`,
 jobs:`<div class="fieldrow"><label>Jobs (id,deadline,profit):</label><input id="jobsInput" value="A-2-100,B-1-19,C-2-27,D-1-25,E-3-15"></div>`,
 coin:`<div class="fieldrow"><label>Amount:</label><input id="amount" type="number" value="93"><label>Coins:</label><input id="coins" value="25,10,5,1"></div>`,
 prim:`<div class="fieldrow"><label>Edges (A-B-weight):</label><input id="graphInput" value="A-B-4,A-C-2,B-C-1,B-D-5,C-D-8,C-E-10,D-E-2,D-F-6,E-F-3"></div>`,
 kruskal:`<div class="fieldrow"><label>Edges (A-B-weight):</label><input id="graphInput" value="A-B-4,A-C-2,B-C-1,B-D-5,C-D-8,C-E-10,D-E-2,D-F-6,E-F-3"></div>`,
 dijkstra:`<div class="fieldrow"><label>Edges (A-B-weight):</label><input id="graphInput" value="A-B-4,A-C-2,B-C-1,B-D-5,C-D-8,C-E-10,D-E-2,D-F-6,E-F-3"></div><div class="fieldrow"><label>Source:</label><input id="sourceInput" value="A"></div>`,
 huffman:`<div class="fieldrow"><label>Symbols with frequencies (symbol:frequency):</label><input id="freqInput" value="A:45,B:13,C:12,D:16,E:9,F:5"></div>`
};

function setAlgo(){
 const a=$("#algoSelect").value; $("#inputPanel").innerHTML=configs[a]; $("#description").innerHTML=`<b>${info[a].title}</b><br><br>${info[a].desc}`;
 reset();
}
$("#algoSelect").addEventListener("change",setAlgo);
$("#themeBtn").onclick=()=>document.body.classList.toggle("dark");

function parseEdges(s){return s.split(",").map(x=>x.trim()).filter(Boolean).map(x=>{let p=x.split("-");return {u:p[0].trim(),v:p[1].trim(),w:+p[2]}})}
function graphData(){let es=parseEdges($("#graphInput").value);let vs=[...new Set(es.flatMap(e=>[e.u,e.v]))];return {es,vs}}

function makeStep(title,explanation,html="",data={}){state.steps.push({title,explanation,html,data})}

function activity(){
 let arr=$("#actInput").value.split(",").map(x=>x.trim()).filter(Boolean).map((x,i)=>{let p=x.split("-");return {id:i+1,s:+p[0],f:+p[1]}}).sort((a,b)=>a.f-b.f);
 if(!arr.length)throw Error("Enter activities.");
 let last=-Infinity, chosen=[];
 makeStep("Sort by finish time",`Activities are sorted by increasing finish time. The greedy choice is the earliest finishing feasible activity.`,activityHTML(arr,[]));
 arr.forEach((a,i)=>{if(a.s>=last){chosen.push(a);last=a.f;makeStep(`Select Activity ${a.id}`,`Start ${a.s} ≥ previous finish ${last===a.f?a.s:last}. It is feasible, so accept it.`,activityHTML(arr,chosen,a));}else makeStep(`Reject Activity ${a.id}`,`Start ${a.s} is before the previous selected finish ${last}, so this activity overlaps and is rejected.`,activityHTML(arr,chosen,a));});
 makeStep("Complete",`Maximum compatible activities selected: ${chosen.length}.`,activityHTML(arr,chosen));
 return [`${chosen.length} activities`, "O(n log n)", "O(n)"];
}
function activityHTML(arr,ch,current){return `<div class="item-grid">${arr.map(a=>`<div class="viz-item ${ch.includes(a)?"accept":""} ${current===a?"active":""}"><b>A${a.id}</b><small>${a.s} → ${a.f}</small></div>`).join("")}</div>`}

function knapsack(){
 let cap=+$("#capacity").value, arr=$("#items").value.split(",").map(x=>x.trim()).filter(Boolean).map((x,i)=>{let p=x.split("-");return{id:i+1,p:+p[0],w:+p[1],r:+p[0]/+p[1]}}).sort((a,b)=>b.r-a.r);
 if(!cap||!arr.length)throw Error("Enter valid capacity and items.");
 let rem=cap,total=0;
 makeStep("Calculate ratios",`For each item, calculate profit ÷ weight. Sort from highest ratio to lowest.`,knapHTML(arr,-1,[]));
 arr.forEach(x=>{if(rem<=0)return;let take=Math.min(x.w,rem),frac=take/x.w;total+=x.p*frac;rem-=take;makeStep(`Take Item ${x.id}`,`Ratio = ${x.r.toFixed(2)}. Take ${(frac*100).toFixed(0)}% of the item; added profit = ${(x.p*frac).toFixed(2)}.`,knapHTML(arr,x.id,arr.filter(y=>y.w-Math.min(y.w,Math.max(0,cap-rem))===0)));});
 makeStep("Complete",`Maximum profit = ${total.toFixed(2)} with capacity ${cap}.`,knapHTML(arr,-1,[]));
 return [`Profit ${total.toFixed(2)}`,"O(n log n)","O(n)"];
}
function knapHTML(arr,current){return `<div class="item-grid">${arr.map(x=>`<div class="viz-item ${current===x.id?"active":""}"><b>Item ${x.id}</b><small>P ${x.p} · W ${x.w}</small><small>Ratio ${x.r.toFixed(2)}</small></div>`).join("")}</div>`}

function jobs(){
 let arr=$("#jobsInput").value.split(",").map(x=>x.trim()).filter(Boolean).map(x=>{let p=x.split("-");return{id:p[0],d:+p[1],p:+p[2]}}).sort((a,b)=>b.p-a.p), D=Math.max(...arr.map(x=>x.d)), slots=Array(D).fill(null),profit=0;
 makeStep("Sort jobs by profit",`Consider the highest-profit job first. Each job is placed in the latest free slot at or before its deadline.`,jobsHTML(arr,slots));
 arr.forEach(j=>{let placed=-1;for(let k=Math.min(j.d,D)-1;k>=0;k--)if(!slots[k]){slots[k]=j;placed=k;break}
 if(placed>=0){profit+=j.p;makeStep(`Schedule Job ${j.id}`,`Job ${j.id} has profit ${j.p}. Slot ${placed+1} is the latest available slot before deadline ${j.d}, so accept it.`,jobsHTML(arr,slots,j.id));}
 else makeStep(`Skip Job ${j.id}`,`No free slot exists before deadline ${j.d}; this job cannot be scheduled.`,jobsHTML(arr,slots,j.id));});
 makeStep("Complete",`Maximum scheduled profit = ${profit}.`,jobsHTML(arr,slots));
 return [`Profit ${profit}`,"O(n log n + nD)","O(D)"];
}
function jobsHTML(arr,slots,current){return `<div><div class="item-grid">${slots.map((x,i)=>`<div class="viz-item ${x?"accept":""} ${x?.id===current?"active":""}"><b>Slot ${i+1}</b><small>${x?x.id:"Free"}</small></div>`).join("")}</div><p class="input-help">Jobs are processed in descending profit order.</p></div>`}

function coin(){
 let amount=+$("#amount").value, coins=$("#coins").value.split(",").map(Number).filter(x=>x>0).sort((a,b)=>b-a), remain=amount, used=[];
 if(amount<0||!coins.length)throw Error("Enter valid amount and coins.");
 makeStep("Sort coins",`Coins are considered from largest to smallest. Current amount = ${amount}.`,coinHTML(coins,remain,used,-1));
 for(const c of coins){while(remain>=c){remain-=c;used.push(c);makeStep(`Take coin ${c}`,`The largest available coin ${c} does not exceed the remaining amount. Remaining = ${remain}.`,coinHTML(coins,remain,used,c));}}
 if(remain!==0)makeStep("Cannot make exact amount",`Greedy stopped with remainder ${remain}. This coin set cannot make the amount exactly using this greedy process.`,coinHTML(coins,remain,used,-1));
 else makeStep("Complete",`Amount ${amount} made using ${used.length} coins: ${used.join(", ")}.`,coinHTML(coins,0,used,-1));
 return [remain===0?`${used.length} coins`:`Remainder ${remain}`,"O(amount / smallest coin)","O(amount)"];
}
function coinHTML(coins,remain,used,current){return `<div><div class="item-grid">${coins.map(c=>`<div class="viz-item ${c===current?"active":""} ${used.includes(c)?"accept":""}"><b>₹${c}</b><small>${used.filter(x=>x===c).length} used</small></div>`).join("")}</div><p><b>Remaining:</b> ${remain} &nbsp; <b>Coins:</b> ${used.join(", ")||"—"}</p></div>`}

function graphViz(es,vs,active=[],done=[]){let pos={};let R=100,cx=310,cy=135;vs.forEach((v,i)=>{let ang=-Math.PI/2+i*2*Math.PI/vs.length;pos[v]={x:cx+R*Math.cos(ang),y:cy+R*Math.sin(ang)}});let edges=es.map((e,i)=>{let a=pos[e.u],b=pos[e.v],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),deg=Math.atan2(dy,dx)*180/Math.PI;return `<div class="edge ${active.includes(i)?"active":""} ${done.includes(i)?"done":""}" style="left:${a.x+23}px;top:${a.y+23}px;width:${len}px;transform:rotate(${deg}deg)"></div><div class="edge-label" style="left:${(a.x+b.x)/2+20}px;top:${(a.y+b.y)/2+15}px">${e.w}</div>`}).join("");let verts=vs.map(v=>`<div class="vertex ${active.includes(v)?"active":""} ${done.includes(v)?"done":""}" style="left:${pos[v].x}px;top:${pos[v].y}px">${v}</div>`).join("");return `<div class="graph">${edges}${verts}</div>`}

function mst(type){
 let {es,vs}=graphData();if(!es.length)throw Error("Enter graph edges.");
 let sorted=[...es].sort((a,b)=>a.w-b.w), chosen=[], parent={};vs.forEach(v=>parent[v]=v);
 function find(x){while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x]}return x} function union(a,b){a=find(a);b=find(b);if(a===b)return false;parent[b]=a;return true}
 if(type==="prim"){
  let vis=[vs[0]], total=0;makeStep(`Start at ${vs[0]}`,`Prim starts with one vertex and repeatedly chooses the minimum edge from the visited set to an unvisited vertex.`,graphViz(es,vs,[],vis));
  while(vis.length<vs.length){let candidates=es.map((e,i)=>({e,i})).filter(x=>(vis.includes(x.e.u)&&!vis.includes(x.e.v))||(!vis.includes(x.e.u)&&vis.includes(x.e.v))).sort((a,b)=>a.e.w-b.e.w);if(!candidates.length)break;let x=candidates[0],e=x.e,n=vis.includes(e.u)?e.v:e.u;vis.push(n);chosen.push(x.i);total+=e.w;makeStep(`Add edge ${e.u}–${e.v}`,`Edge weight ${e.w} is the smallest edge connecting the current tree to an unvisited vertex.`,graphViz(es,vs,[x.i],chosen));}
  makeStep("MST complete",`Minimum spanning tree weight = ${total}.`,graphViz(es,vs,[],chosen));return [`MST weight ${total}`,"O(V²)","O(V)"];
 } else {
  let total=0;makeStep("Sort edges",`Kruskal sorts all edges by increasing weight, then adds an edge only when it does not create a cycle.`,graphViz(sorted,vs));
  sorted.forEach((e,i)=>{let original=es.indexOf(e);if(union(e.u,e.v)){chosen.push(original);total+=e.w;makeStep(`Accept ${e.u}–${e.v}`,`Weight ${e.w} is the smallest remaining edge and it does not form a cycle.`,graphViz(es,vs,[original],chosen));}else makeStep(`Reject ${e.u}–${e.v}`,`Weight ${e.w} would create a cycle, so the edge is rejected.`,graphViz(es,vs,[original],chosen));});
  makeStep("MST complete",`Minimum spanning tree weight = ${total}.`,graphViz(es,vs,[],chosen));return [`MST weight ${total}`,"O(E log E)","O(V)"];
 }
}

function dijkstra(){
 let {es,vs}=graphData(), src=$("#sourceInput").value.trim();if(!vs.includes(src))src=vs[0];
 let d={},used=new Set(),prev={};vs.forEach(v=>d[v]=Infinity);d[src]=0;
 makeStep(`Start at ${src}`,`Distance to source is 0; every other distance starts at infinity.`,distHTML(vs,d,used));
 while(used.size<vs.length){let u=vs.filter(v=>!used.has(v)).sort((a,b)=>d[a]-d[b])[0];if(d[u]===Infinity)break;used.add(u);
  makeStep(`Visit ${u}`,`Vertex ${u} has the smallest tentative distance (${d[u]}), so its shortest distance is finalized.`,distHTML(vs,d,used,u));
  es.forEach(e=>{let v=null;if(e.u===u)v=e.v;else if(e.v===u)v=e.u;if(v&&!used.has(v)&&d[u]+e.w<d[v]){let old=d[v];d[v]=d[u]+e.w;prev[v]=u;makeStep(`Relax ${u} → ${v}`,`New distance ${d[v]} = ${d[u]} + ${e.w}, improving ${old===Infinity?"∞":old}.`,distHTML(vs,d,used,v));}});
 }
 makeStep("Complete",`Shortest distances from ${src}: ${vs.map(v=>`${v}=${d[v]===Infinity?"∞":d[v]}`).join(", ")}.`,distHTML(vs,d,used));return [`Distances from ${src}`,"O(V²)","O(V)"];
}
function distHTML(vs,d,used,active){return `<div class="item-grid">${vs.map(v=>`<div class="viz-item ${v===active?"active":""} ${used.has(v)?"accept":""}"><b>${v}</b><small>${d[v]===Infinity?"∞":d[v]}</small></div>`).join("")}</div>`}

function huffman(){
 let arr=$("#freqInput").value.split(",").map(x=>x.trim()).filter(Boolean).map(x=>{let p=x.split(":");return{s:p[0],f:+p[1],code:""}});if(arr.length<2)throw Error("Enter at least two symbols.");
 let nodes=arr.map(x=>({label:x.s,f:x.f,items:[x.s]}));makeStep("Build frequency list",`Huffman repeatedly combines the two nodes with the lowest frequencies.`,huffHTML(nodes));
 while(nodes.length>1){nodes.sort((a,b)=>a.f-b.f);let a=nodes.shift(),b=nodes.shift(),n={label:`(${a.label}+${b.label})`,f:a.f+b.f,items:[...a.items,...b.items],left:a,right:b};nodes.push(n);makeStep(`Combine ${a.f} + ${b.f}`,`The two least frequent nodes are combined into a new node with frequency ${n.f}.`,huffHTML(nodes,a,b));}
 let root=nodes[0], codes={};function walk(n,c){if(n.items.length===1){codes[n.items[0]]=c||"0";return}walk(n.left,c+"0");walk(n.right,c+"1")}walk(root,"");
 makeStep("Generate codes",`Assign 0 to left branches and 1 to right branches. The result is a prefix-free Huffman code.`,huffHTML([root],codes));
 return [`Codes: ${Object.entries(codes).map(([k,v])=>k+"="+v).join(" · ")}`,"O(n log n)","O(n)"];
}
function huffHTML(nodes,activeA,activeB){if(activeA&&activeB)return `<div class="codes"><div class="code-chip">${activeA.label}: ${activeA.f}</div><div class="code-chip">${activeB.label}: ${activeB.f}</div></div><p>Combined → ${activeA.f+activeB.f}</p>`;return `<div class="codes">${nodes.map(n=>`<div class="code-chip">${n.label}: ${n.f}</div>`).join("")}</div>`}

function build(){
 let a=$("#algoSelect").value;state.steps=[];let out;
 if(a==="activity")out=activity();if(a==="knapsack")out=knapsack();if(a==="jobs")out=jobs();if(a==="coin")out=coin();if(a==="prim")out=mst("prim");if(a==="kruskal")out=mst("kruskal");if(a==="dijkstra")out=dijkstra();if(a==="huffman")out=huffman();
 $("#result").textContent=out[0];$("#time").textContent=out[1];$("#space").textContent=out[2];state.i=0;render();$("#status").textContent="Ready to play";$("#status").className="status";
}
function render(){let n=state.steps.length;if(!n)return;let s=state.steps[state.i];$("#canvas").innerHTML=s.html;$("#stepTitle").textContent=s.title;$("#stepCount").textContent=`Step ${state.i+1} / ${n}`;$("#explanation").innerHTML=s.explanation;$("#progress").style.width=((state.i+1)/n*100)+"%"}
function play(){if(state.running)return;state.running=true;$("#status").textContent="Running";$("#status").className="status running";tick()}
function tick(){if(!state.running)return;if(state.i>=state.steps.length-1){state.running=false;$("#status").textContent="Complete";$("#status").className="status done";return}state.i++;render();state.timer=setTimeout(tick,1700-+$("#speed").value)}
function pause(){state.running=false;clearTimeout(state.timer);$("#status").textContent="Paused";$("#status").className="status"}
function next(){pause();if(state.i<state.steps.length-1){state.i++;render()}}
function reset(){pause();state.steps=[];state.i=0;$("#canvas").innerHTML=`<div style="display:grid;place-items:center;min-height:270px;color:var(--muted)">Press <b>Run Algorithm</b> to generate the visualization.</div>`;$("#stepTitle").textContent="Waiting for input";$("#stepCount").textContent="Step 0 / 0";$("#progress").style.width="0";$("#result").textContent="—";$("#time").textContent="—";$("#space").textContent="—";$("#status").textContent="Ready";$("#status").className="status"}
$("#runBtn").onclick=()=>{try{build();play()}catch(e){alert(e.message)}};
$("#pauseBtn").onclick=pause;$("#nextBtn").onclick=next;$("#resetBtn").onclick=reset;

const questions=[
["Which greedy rule is used in Activity Selection?",["Earliest start time","Earliest finish time","Largest duration","Highest profit"],1],
["Fractional Knapsack sorts items by:",["Weight","Profit only","Profit/weight ratio","Item number"],2],
["Kruskal rejects an edge when it:",["Has a high weight","Creates a cycle","Connects two vertices","Is first"],1],
["Dijkstra requires edge weights to be:",["All negative","Non-negative","All equal","Prime"],1],
["Huffman repeatedly combines:",["Two largest frequencies","Two smallest frequencies","Random nodes","Two equal frequencies only"],1]
];
$("#quizBox").innerHTML=questions.map((q,i)=>`<div class="q"><b>${i+1}. ${q[0]}</b>${q[1].map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}">${o}</label>`).join("")}</div>`).join("");
$("#submitQuiz").onclick=()=>{let score=0;questions.forEach((q,i)=>{let v=document.querySelector(`input[name=q${i}]:checked`);if(v&&+v.value===q[2])score++});$("#quizScore").textContent=`Score: ${score}/${questions.length}`};
setAlgo();

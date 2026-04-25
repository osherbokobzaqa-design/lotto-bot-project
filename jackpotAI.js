class JackpotAI {
  constructor(history){
    this.history=history||[5000000,6000000,7000000];
  }

  avg(){
    return this.history.reduce((a,b)=>a+b,0)/this.history.length;
  }

  analyze(j){
    const avg=this.avg();
    const z=(j-avg)/1000000;
    return {
      jackpot:j,
      avg,
      z,
      overlay:j>avg
    };
  }
}

module.exports=JackpotAI;

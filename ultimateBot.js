const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN 
const bot = new TelegramBot(token, { polling: true });
function generateLotto(){
  let nums=[];
  while(nums.length<6){
    let n=Math.floor(Math.random()*37)+1;
    if(!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a,b)=>a-b);
}

function generateChance(){
  const suits=["♠","♥","♦","♣"];
  const values=["7","8","9","10","J","Q","K","A"];
  return suits.map(s=>values[Math.floor(Math.random()*values.length)] + s);
}

bot.onText(/\/start/, (msg)=>{
  bot.sendMessage(msg.chat.id,"AI BOT READY",{
    reply_markup:{
      inline_keyboard:[
        [{text:"🎲 Lotto",callback_data:"lotto"}],
        [{text:"🂡 Chance",callback_data:"chance"}]
      ]
    }
  });
});

bot.on("callback_query",(q)=>{
  const id=q.message.chat.id;

  if(q.data==="lotto"){
    bot.sendMessage(id,"🎲 "+generateLotto().join(", "));
  }

  if(q.data==="chance"){
    bot.sendMessage(id,"🂡 "+generateChance().join(" | "));
  }
});

const express=require('express');
const app=express();

app.get('/stats',(req,res)=>{
  res.json({
    hot:[5,12,18,22],
    cold:[1,2,3,4]
  });
});

app.listen(4000);

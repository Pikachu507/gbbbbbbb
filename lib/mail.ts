/** Optional transactional email with Resend (verified domain required). No false delivery claims. */
export async function sendOrderEmail(to:string,number:string,status:string){
 const apiKey=process.env.RESEND_API_KEY,from=process.env.MAIL_FROM;
 if(!apiKey||!from)return {sent:false,reason:'Email integration not configured'};
 const safeNumber=number.replace(/[^A-Z0-9-]/gi,'').slice(0,32);
 const text=status==='paid'?`O pagamento da encomenda ${safeNumber} foi confirmado. Podes acompanhar o estado na tua conta Goal District.`:`O estado da encomenda ${safeNumber} passou para ${status}. Consulta a tua conta para mais informações.`;
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to,subject:`Goal District · Encomenda ${safeNumber}`,text})});if(!response.ok)throw Error(`Resend HTTP ${response.status}`);return {sent:true}}
 catch(e){console.error('Transactional email failed:',e);return {sent:false,reason:'Email delivery failure'}};
}

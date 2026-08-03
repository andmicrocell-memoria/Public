import axios from "axios";

async function main() {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "852136",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "5581981826072",
                phone_number_id: "1256883267499769"
              },
              contacts: [
                {
                  profile: {
                    name: "Dono Testando"
                  },
                  wa_id: "558181691725"
                }
              ],
              messages: [
                {
                  from: "558181691725",
                  id: "wamid.test_br_9th_digit_" + Date.now(),
                  timestamp: String(Math.floor(Date.now()/1000)),
                  text: {
                    body: "Teste do dono com número de celular BR"
                  },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  try {
    console.log("Enviando mensagem de teste para o webhook local...");
    const res = await axios.post("http://localhost:3000/api/webhook/whatsapp", payload);
    console.log("Status resposta imediata:", res.status, res.data);
    
    console.log("Aguardando 12 segundos para processamento da IA e envio via WhatsApp Cloud API...");
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    const logsRes = await axios.get("http://localhost:3000/api/webhook/logs");
    console.log("Logs no servidor (agora salvos no Firestore):", JSON.stringify(logsRes.data.slice(0, 5), null, 2));
  } catch (err: any) {
    console.error("Falha no teste:", err.message);
  }
}

main();

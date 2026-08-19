// Mapa cliente → planilha de leads, extraído automaticamente dos workflows de leads
// do n8n (node "Google Sheets" de cada fluxo). Cada entrada aponta para o Google Sheets
// onde os leads daquele cliente caem (o mesmo lido pela automação que avisa o WhatsApp).
//
// Como manter atualizado: cada workflow "Leads - <Cliente>" no n8n tem um node Google Sheets
// cujo `documentId` contém a URL da planilha. O `spreadsheetId` abaixo é o trecho
// /spreadsheets/d/<ID>/ dessa URL. Ao criar um cliente novo no n8n, adicione-o aqui.
//
// Observação: o monitor lê TODAS as abas da planilha (não depende do nome da aba),
// então clientes cujo fluxo usa várias abas (ex.: Tech Lopes, AS Service) aparecem
// com um único cartão somando todas as abas.

export const LEADS_MONITOR_CLIENTS = [
  // ── Ativos ────────────────────────────────────────────────────────────────
  { id: 'comag', name: 'Comag', spreadsheetId: '14uP0bSfhgXP1NBoqjEbfupTuy4so8n6SqGzVmlhQOYI', active: true },
  { id: 'zampronio', name: 'Zampronio', spreadsheetId: '1yhAiReBPc7sRbgpJdGFhqkZPbzgAD1stoouR8XcCBxQ', active: true },
  { id: 'nbrtec-br', name: 'NBR TEC BR', spreadsheetId: '1ssgdfHvjJ5PYYSXQqMaMIr6zwZiHqV9qCqIMU7GUN0Y', active: true },
  { id: 'super-roletes', name: 'Super Roletes', spreadsheetId: '1OoQU4cuULx_TtgPclV5t_3RX1O8IfqT6wn0-XlP-SAs', active: true },
  { id: 'grafica-rafael', name: 'Gráfica Rafael', spreadsheetId: '1jSwUV9vz_5EOtF4BEJyr_UFuSyOLlTuUAe5G4Uqnf0s', active: true },
  { id: 'torres-evandro', name: 'Torres · Evandro', spreadsheetId: '1_qN53gxgcsGc1WcKeywk5nwAz4G8RUsuemU8l7nQEPM', active: true },
  { id: 'torres-adilson', name: 'Torres AML · Adilson', spreadsheetId: '1Att_27aZITp4hwdmqEVW0npCMMx0YSoZ-dRnvt1btLM', active: true },
  { id: 'torres-renan-francis', name: 'Torres · Renan e Francis', spreadsheetId: '1LSO6QvLpCjOv8sK-kU6S0igqpaqpW_86TGhgpAypLH4', active: true },
  { id: 'maass', name: 'Maass', spreadsheetId: '1NM4xjnlvqYd0C6w7LldU569G6Pny74sid1zzAiRFenI', active: true },
  { id: 'seven-steel', name: 'Seven Steel', spreadsheetId: '1B5fHCMGeRWawTKJ9DoSCKmiFxLemaRTDCd3z8uG8x7Y', active: true },
  { id: 'tech-lopes', name: 'Tech Lopes', spreadsheetId: '1sG8SsxEpWdB5mG-nz1wAxSuqTDUCM3GXRYAXB0_Fhag', active: true },
  { id: 'lange', name: 'Lange', spreadsheetId: '1PzMqXwyiWgzDM1OznW-n-GuAykG3mT0EQjrdN2qVSGw', active: true },
  { id: 'fvc', name: 'FVC', spreadsheetId: '1W4hvwDAUs0oD7j9rN0TNDDDhaUQ2dnD7XobSXCqbTVI', active: true },
  { id: 'nunes', name: 'Nunes Flex', spreadsheetId: '1c_mzCsg8iALoQo2gdBGzX9XjHEGc1uoX3nihGRrebys', active: true },
  { id: 'star-network', name: 'Star Network', spreadsheetId: '1h09gFpfOm7ROGA5wA3mbabOznwghMWxscnYs5VWpgY4', active: true },
  { id: 'maze', name: 'Maze', spreadsheetId: '1o4zw33WHsDYf0lG9LJqM1-qW73ra51AaStEdgiiZlYs', active: true },
  { id: 'ipam', name: 'IPAM', spreadsheetId: '1wcfOs-yjC1equiNqoAuU3Mg6ERlOl5HW7FyMIlplMnM', active: true },
  { id: 'colhe-planti', name: 'Colhe Planti', spreadsheetId: '1kxEceBQ7YxOywGVA5RQgfpMbRU3srtpxs8ykxID3-9M', active: true },
  { id: 'as-service', name: 'AS Service', spreadsheetId: '1kiD9TJPVtH0hFPK-9FSl_PAFjapNzp9rbNSKXpRpvx8', active: true },
  { id: 'dura-forte', name: 'Dura Forte', spreadsheetId: '1HhZqd_GzKcAphj2RyGevrx5VGEnEQyAVrbnfgEd5xgg', active: true },
  { id: 'embanor', name: 'Embanor', spreadsheetId: '1J4mgybLjZpnUHc1-DO77sWmKOLvBbro55vSEtwrxZDY', active: true },
  { id: 'grain-save', name: 'Grain Save', spreadsheetId: '1lZGltMbAyg-h_yGiIFxB4M34JNPfp0dsXLsSnfveZjc', active: true },
  { id: 'techose', name: 'TecHose', spreadsheetId: '17W9fzbpHgO9F2nz9gugsqqipBUu661MygCvVlp_fiYc', active: true },
  { id: 'pondus', name: 'Pondus', spreadsheetId: '1kJGxPzhPqYyqW4s6R6ASEC6yjFnj0WRHFA82Wh7HdJI', active: true },
  { id: 'lmb', name: 'LMB', spreadsheetId: '18zWIjyiN8Ecc6CFUudqj-F5RHx5kLEFlKWU0Ka2SCNQ', active: true },

  // ── Inativos (fluxo pausado no n8n) ─────────────────────────────────────────
  { id: 'montadora', name: 'Montadora', spreadsheetId: '1Adrf56z_zfy_DoR4Gv8akNLMb6QdePRpi2I8wpm1lbA', active: false },
  { id: 'nbrtec-aml', name: 'NBR TEC AML', spreadsheetId: '1RuAk2GMZ0ptpbzMZVU6TOJx2leZMLGh6LKOqhhFcvDs', active: false },
  { id: 'becker-trade', name: 'Becker Trade / África', spreadsheetId: '19qz-rT6XEmK6FSaZNu1MQsgImTI0pybVtJZyvZO_xwg', active: false },
  { id: 'inau', name: 'INAU', spreadsheetId: '1aT9SKyJJ_2-_tT12U7WrLVlfPRTF-vo5brmk8ehh3l4', active: false },
]

export function getLeadsMonitorClient(id) {
  return LEADS_MONITOR_CLIENTS.find((c) => c.id === id) || null
}

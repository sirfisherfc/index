/* Repasse de atribuicao entre o site e o portal de reservas.
   ---------------------------------------------------------------------------
   O portal vive em outro subdominio (reservas.sirfisher.com.br) e so registra a
   origem que chega na propria URL. Sem este repasse, um clique de anuncio que
   cai numa pagina do site perde a atribuicao no salto para a reserva — e a
   campanha fica sem como provar que gerou a mesa.

   PRECEDENCIA: quem chega vence quem esta escrito na pagina.
   Cada pagina ja carrega um padrao no proprio botao, por exemplo
   utm_source=site&utm_medium=organic&utm_content=almoco_executivo. Esse padrao
   descreve de onde a pessoa CLICOU, e serve enquanto ela chegou por conta
   propria. Quando ela chega por um anuncio, a verdade e o anuncio: sobrescrever
   e o comportamento correto. A versao anterior deste codigo so preenchia chave
   ausente (`!has(key)`), o que fazia o padrao da pagina vencer o anuncio e
   registrar trafego pago como organico.

   O utm_content da pagina sobrevive quando o anuncio nao manda o seu, o que da
   de graca a informacao de qual pagina converteu.

   Os identificadores de clique (fbclid, gclid) viajam junto porque sao o que
   permite ao Pixel do Meta montar o cookie _fbc no dominio do portal e ao
   Google Ads reconciliar a conversao mais tarde.
   --------------------------------------------------------------------------- */
(function () {
  var tracked = [
    'oppref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'campaign_id', 'ad_group_id', 'ad_id', 'fbclid', 'gclid'
  ];

  var source = new URLSearchParams(window.location.search);
  if (!tracked.some(function (key) { return source.get(key); })) return;

  document.querySelectorAll('a[href^="https://reservas.sirfisher.com.br/"]').forEach(function (link) {
    var destination;
    try {
      destination = new URL(link.href);
    } catch (e) {
      return;
    }

    tracked.forEach(function (key) {
      var value = source.get(key);
      if (value) destination.searchParams.set(key, value);
    });

    link.href = destination.toString();
  });
})();

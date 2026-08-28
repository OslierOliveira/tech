/* ========================================
   FinancasApp - Dashboard
======================================== */

protegerPagina();
renderizarNav('dashboard');

document.getElementById('btn-sair').addEventListener('click', () => Api.logout());

const hoje = new Date();
let anoAtual = hoje.getFullYear();
let mesAtual = hoje.getMonth() + 1; // 1-12

document.getElementById('mes-anterior').addEventListener('click', () => mudarMes(-1));
document.getElementById('mes-proximo').addEventListener('click', () => mudarMes(1));

function mudarMes(delta) {
  mesAtual += delta;
  if (mesAtual < 1) { mesAtual = 12; anoAtual--; }
  if (mesAtual > 12) { mesAtual = 1; anoAtual++; }
  carregarDashboard();
}

async function carregarDashboard() {
  document.getElementById('mes-atual-label').textContent = `${NOMES_MESES[mesAtual - 1]} ${anoAtual}`;

  const [resposta, categorias] = await Promise.all([
    Api.get('dashboard', { ano: anoAtual, mes: mesAtual }),
    obterCategorias()
  ]);

  if (!resposta.sucesso) {
    alert('Erro ao carregar o dashboard: ' + resposta.erro);
    return;
  }

  const d = resposta.dados;

  document.getElementById('valor-total').textContent = formatarMoeda(d.total_mes);
  document.getElementById('valor-pago').textContent = formatarMoeda(d.total_pago);
  document.getElementById('valor-pendente').textContent = formatarMoeda(d.total_pendente);
  document.getElementById('valor-vencido').textContent = formatarMoeda(d.total_vencido);

  document.getElementById('barra-comprometido').style.width = `${d.percentual_comprometido}%`;
  document.getElementById('texto-comprometido').textContent = `${d.percentual_comprometido}%`;
  document.getElementById('texto-qtd-pendentes').textContent = d.quantidade_pendentes;

  // Próximas a vencer
  const listaProximas = document.getElementById('lista-proximas');
  if (d.proximas_a_vencer.length === 0) {
    listaProximas.innerHTML = '<p class="estado-vazio">Nenhuma conta vencendo nos próximos 7 dias 🎉</p>';
  } else {
    listaProximas.innerHTML = d.proximas_a_vencer.map((c) => `
      <div class="linha-lista">
        <div>
          <div class="descricao">${c.descricao}</div>
          <div class="detalhe">${nomeCategoria(categorias, c.categoria_id)}</div>
        </div>
        <div style="text-align:right">
          <div>${formatarMoeda(c.valor_previsto)}</div>
          <div class="detalhe">${formatarDataBR(c.vencimento)}</div>
        </div>
      </div>
    `).join('');
  }

  // Resumo por categoria
  const listaCategorias = document.getElementById('lista-categorias');
  const entradas = Object.entries(d.resumo_por_categoria);
  if (entradas.length === 0) {
    listaCategorias.innerHTML = '<p class="estado-vazio">Sem lançamentos neste mês</p>';
  } else {
    listaCategorias.innerHTML = entradas
      .sort((a, b) => b[1] - a[1])
      .map(([categoriaId, valor]) => `
        <div class="linha-lista">
          <div class="descricao">${nomeCategoria(categorias, categoriaId)}</div>
          <div>${formatarMoeda(valor)}</div>
        </div>
      `).join('');
  }

  // Comparativo
  const diferenca = d.comparativo.mes_atual - d.comparativo.mes_anterior;
  const sinal = diferenca > 0 ? '+' : '';
  document.getElementById('lista-comparativo').innerHTML = `
    <div class="linha-lista">
      <div class="descricao">Mês anterior</div>
      <div>${formatarMoeda(d.comparativo.mes_anterior)}</div>
    </div>
    <div class="linha-lista">
      <div class="descricao">Este mês</div>
      <div>${formatarMoeda(d.comparativo.mes_atual)} <span class="detalhe">(${sinal}${formatarMoeda(diferenca)})</span></div>
    </div>
  `;
}

carregarDashboard();
